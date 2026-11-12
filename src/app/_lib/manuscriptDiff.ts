import type { JSONContent } from "@tiptap/react";

// Comparing two frozen versions of a manuscript. Nothing here is stored: it reads the two saved documents and works
// out what changed, first paragraph by paragraph, then word by word inside a paragraph that was rewritten.
// Formatting (fonts, sizes, colours) is deliberately ignored: only the words matter to a reviewer.

export type BlockKind = "heading" | "paragraph" | "item" | "quote" | "code" | "row" | "image";

export type Block = {
  kind: BlockKind;
  text: string;
  level?: number; // heading level 1-3
  marker?: string; // list bullet or number
  depth?: number; // list nesting
};

export type Part = { t: "same" | "add" | "del"; text: string };

export type DiffRow =
  | { type: "same"; block: Block }
  | { type: "added"; block: Block }
  | { type: "removed"; block: Block }
  | { type: "changed"; before: Block; after: Block; parts: Part[] };

export type DiffStats = {
  changed: number; // paragraphs rewritten
  added: number; // paragraphs only in the newer version
  removed: number; // paragraphs only in the older version
  wordsAdded: number;
  wordsRemoved: number;
};

export type DiffResult = { rows: DiffRow[]; stats: DiffStats; coarse: boolean };

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;
const MAX_CELLS = 16_000_000; // the largest table the alignment will fill (4000 x 4000 paragraphs)
const MAX_PAIR_CELLS = 4_000_000;
const MIN_SIMILARITY = 0.4;

export const countWords = (text: string) => (text.match(WORD) ?? []).length;

function textOf(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";

  return (node.content ?? []).map(textOf).join("");
}

function pushBlock(out: Block[], block: Block) {
  const text = block.text.replace(/\s+/g, " ").trim();
  if (block.kind === "image" || text) out.push({ ...block, text });
}

function walk(node: JSONContent, out: Block[], depth: number, marker?: string) {
  switch (node.type) {
    case "paragraph":
      pushBlock(out, marker ? { kind: "item", text: textOf(node), marker, depth } : { kind: "paragraph", text: textOf(node) });
      return;
    case "heading":
      pushBlock(out, { kind: "heading", text: textOf(node), level: Number(node.attrs?.level) || 1 });
      return;
    case "bulletList":
    case "orderedList": {
      const ordered = node.type === "orderedList";
      const start = Number(node.attrs?.start) || 1;
      (node.content ?? []).forEach((item, index) => {
        const label = ordered ? `${start + index}.` : "•";
        // The first paragraph of an item carries the marker; anything nested below is indented.
        (item.content ?? []).forEach((child, i) => {
          if (child.type === "bulletList" || child.type === "orderedList") walk(child, out, depth + 1);
          else walk(child, out, depth, i === 0 ? label : "");
        });
      });
      return;
    }
    case "blockquote":
      (node.content ?? []).forEach((child) => pushBlock(out, { kind: "quote", text: textOf(child) }));
      return;
    case "codeBlock":
      pushBlock(out, { kind: "code", text: textOf(node) });
      return;
    case "table":
      (node.content ?? []).forEach((row) => {
        const cells = (row.content ?? []).map((cell) => textOf(cell).replace(/\s+/g, " ").trim());
        pushBlock(out, { kind: "row", text: cells.join("  |  ") });
      });
      return;
    case "image":
      pushBlock(out, { kind: "image", text: String(node.attrs?.alt ?? "").trim() || "Picture" });
      return;
    default: // pageBreak and anything else without words
      return;
  }
}

// A manuscript as a flat list of readable blocks: paragraphs, headings, list items, table rows, pictures.
export function toBlocks(doc: JSONContent | undefined): Block[] {
  const out: Block[] = [];
  for (const node of doc?.content ?? []) walk(node, out, 0);

  return out;
}

const blockKey = (b: Block) => `${b.kind}\u0000${b.text}`;

// Longest common subsequence of two key lists; returns the matched index pairs, or null when it is too big to align.
function lcsPairs(a: string[], b: string[]): [number, number][] | null {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return [];
  if ((n + 1) * (m + 1) > MAX_CELLS) return null;

  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }

  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++;
    else j++;
  }

  return pairs;
}

// Align two lists with the same key function: unchanged items are matched, the rest come back as gaps in between.
type Aligned = { kind: "same"; a: number; b: number } | { kind: "gap"; a: number[]; b: number[] };

function align(a: string[], b: string[]): { items: Aligned[]; coarse: boolean } {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const middle = lcsPairs(a.slice(start, endA), b.slice(start, endB));
  const items: Aligned[] = [];
  for (let k = 0; k < start; k++) items.push({ kind: "same", a: k, b: k });

  let coarse = false;
  let pairs = middle;
  if (!pairs) {
    coarse = true;
    pairs = [];
  }

  let ia = start;
  let ib = start;
  const flushGap = (toA: number, toB: number) => {
    if (ia < toA || ib < toB) {
      items.push({ kind: "gap", a: range(ia, toA), b: range(ib, toB) });
    }
  };

  for (const [pa, pb] of pairs) {
    flushGap(start + pa, start + pb);
    items.push({ kind: "same", a: start + pa, b: start + pb });
    ia = start + pa + 1;
    ib = start + pb + 1;
  }
  flushGap(endA, endB);
  for (let k = 0; k < a.length - endA; k++) items.push({ kind: "same", a: endA + k, b: endB + k });

  return { items, coarse };
}

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k);

const wordSet = (text: string) => new Set((text.toLowerCase().match(WORD) ?? []));

function similarity(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 1;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;

  const jaccard = shared / (a.size + b.size - shared);
  // A sentence that was expanded keeps most of its old words even though they are a small part of the new one,
  // so how much of the shorter text survives counts too (a little discounted).
  const kept = (shared / Math.min(a.size, b.size)) * 0.8;

  return Math.max(jaccard, kept);
}

// Inside a gap of removed and added blocks, find the ones that are the same paragraph rewritten (similar enough,
// same kind, in the same order). Everything else is a plain removal or addition.
function pairRewrites(before: Block[], after: Block[]): [number, number][] {
  if (before.length === 0 || after.length === 0 || before.length * after.length > MAX_PAIR_CELLS) return [];

  const setsA = before.map((b) => wordSet(b.text));
  const setsB = after.map((b) => wordSet(b.text));
  const n = before.length;
  const m = after.length;
  const width = m + 1;
  const score = (i: number, j: number) => {
    // A picture is either the same or a different one; there is no such thing as an edited picture.
    if (before[i].kind !== after[j].kind || before[i].kind === "image") return 0;
    const s = similarity(setsA[i], setsB[j]);

    return s >= MIN_SIMILARITY ? s : 0;
  };

  const table = new Float32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const s = score(i, j);
      table[i * width + j] = Math.max(table[(i + 1) * width + j], table[i * width + j + 1], s > 0 ? s + table[(i + 1) * width + j + 1] : 0);
    }
  }

  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const s = score(i, j);
    if (s > 0 && Math.abs(table[i * width + j] - (s + table[(i + 1) * width + j + 1])) < 1e-6) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++;
    else j++;
  }

  return pairs;
}

// Word-by-word comparison of one paragraph that was rewritten. Pieces are kept in reading order; a replaced stretch
// shows the old words (del) right before the new words (add).
export function diffWords(oldText: string, newText: string): Part[] {
  const a = oldText.match(/\s+|\S+/g) ?? [];
  const b = newText.match(/\s+|\S+/g) ?? [];
  const pairs = lcsPairs(a, b);
  type Op = { t: Part["t"]; text: string };
  const ops: Op[] = [];

  if (!pairs) {
    return [
      { t: "del", text: oldText },
      { t: "add", text: newText },
    ];
  }

  let i = 0;
  let j = 0;
  for (const [pa, pb] of [...pairs, [a.length, b.length] as [number, number]]) {
    while (i < pa) ops.push({ t: "del", text: a[i++] });
    while (j < pb) ops.push({ t: "add", text: b[j++] });
    if (pa < a.length) ops.push({ t: "same", text: a[pa] });
    i = pa + 1;
    j = pb + 1;
  }

  // A lone space between two changes is not worth showing as unchanged: fold it into the change, so a rewritten
  // phrase reads as one red piece followed by one green piece instead of confetti.
  const folded: Op[] = [];
  ops.forEach((op, k) => {
    const between = op.t === "same" && !op.text.trim() && ops[k - 1] && ops[k - 1].t !== "same" && ops[k + 1] && ops[k + 1].t !== "same";
    if (between) {
      folded.push({ t: "del", text: op.text }, { t: "add", text: op.text });
    } else folded.push(op);
  });

  const parts: Part[] = [];
  let dels = "";
  let adds = "";
  const flush = () => {
    if (dels) parts.push({ t: "del", text: dels });
    if (adds) parts.push({ t: "add", text: adds });
    dels = "";
    adds = "";
  };
  for (const op of folded) {
    if (op.t === "del") dels += op.text;
    else if (op.t === "add") adds += op.text;
    else {
      flush();
      const last = parts[parts.length - 1];
      if (last && last.t === "same") last.text += op.text;
      else parts.push({ t: "same", text: op.text });
    }
  }
  flush();

  return parts;
}

export function compareDocuments(oldDoc: JSONContent | undefined, newDoc: JSONContent | undefined): DiffResult {
  const before = toBlocks(oldDoc);
  const after = toBlocks(newDoc);
  const { items, coarse } = align(before.map(blockKey), after.map(blockKey));
  const rows: DiffRow[] = [];
  const stats: DiffStats = { changed: 0, added: 0, removed: 0, wordsAdded: 0, wordsRemoved: 0 };

  for (const item of items) {
    if (item.kind === "same") {
      rows.push({ type: "same", block: after[item.b] });
      continue;
    }

    const gapBefore = item.a.map((k) => before[k]);
    const gapAfter = item.b.map((k) => after[k]);
    const pairs = pairRewrites(gapBefore, gapAfter);
    let ia = 0;
    let ib = 0;
    const removeUntil = (to: number) => {
      for (; ia < to; ia++) {
        rows.push({ type: "removed", block: gapBefore[ia] });
        stats.removed++;
        stats.wordsRemoved += countWords(gapBefore[ia].text);
      }
    };
    const addUntil = (to: number) => {
      for (; ib < to; ib++) {
        rows.push({ type: "added", block: gapAfter[ib] });
        stats.added++;
        stats.wordsAdded += countWords(gapAfter[ib].text);
      }
    };

    for (const [pa, pb] of pairs) {
      removeUntil(pa);
      addUntil(pb);
      const parts = diffWords(gapBefore[pa].text, gapAfter[pb].text);
      rows.push({ type: "changed", before: gapBefore[pa], after: gapAfter[pb], parts });
      stats.changed++;
      for (const part of parts) {
        if (part.t === "add") stats.wordsAdded += countWords(part.text);
        if (part.t === "del") stats.wordsRemoved += countWords(part.text);
      }
      ia = pa + 1;
      ib = pb + 1;
    }
    removeUntil(gapBefore.length);
    addUntil(gapAfter.length);
  }

  return { rows, stats, coarse };
}

// Did the words a comment pointed at change in the newer version? The comment belongs to the older side of the
// comparison; its paragraph is found by counting the rows that have an older side (same, changed, removed).
//   "removed"   the whole paragraph is gone
//   "changed"   the paragraph was reworded and the commented words were among the replaced ones
//   "unchanged" the commented words are still as they were (the paragraph may have changed elsewhere)
// A comment on the whole version has no words to check (null).
export type AddressedState = "removed" | "changed" | "unchanged";

export function commentState(rows: DiffRow[], comment: { block_index: number | null; start_offset: number | null; end_offset: number | null }): AddressedState | null {
  if (comment.block_index === null || comment.start_offset === null || comment.end_offset === null) return null;

  let oldIndex = -1;
  for (const row of rows) {
    if (row.type === "added") continue;
    if (++oldIndex !== comment.block_index) continue;
    if (row.type === "same") return "unchanged";
    if (row.type === "removed") return "removed";
    if (row.type !== "changed") return null;

    let at = 0;
    for (const part of row.parts) {
      if (part.t === "add") continue;
      const from = at;
      at += part.text.length;
      if (part.t === "del" && from < comment.end_offset && at > comment.start_offset) return "changed";
    }

    return "unchanged";
  }

  return null;
}

// A reviewer mostly wants the changes: unchanged runs fold away, leaving a little context around each change.
export type Section = { kind: "change"; row: DiffRow; index: number } | { kind: "same"; rows: DiffRow[]; id: number } | { kind: "folded"; count: number; id: number };

export function toSections(rows: DiffRow[], onlyChanges: boolean, expanded: ReadonlySet<number>, context = 1): Section[] {
  const sections: Section[] = [];
  let change = 0;
  let k = 0;

  while (k < rows.length) {
    const row = rows[k];
    if (row.type !== "same") {
      sections.push({ kind: "change", row, index: change++ });
      k++;
      continue;
    }

    let end = k;
    while (end < rows.length && rows[end].type === "same") end++;
    const run = rows.slice(k, end);
    const first = k === 0;
    const last = end === rows.length;

    if (!onlyChanges || expanded.has(k)) {
      sections.push({ kind: "same", rows: run, id: k });
    } else {
      // keep `context` paragraphs next to a change, fold the middle
      const head = first ? 0 : Math.min(context, run.length);
      const tail = last ? 0 : Math.min(context, run.length - head);
      const hidden = run.length - head - tail;

      if (hidden < 2) sections.push({ kind: "same", rows: run, id: k });
      else {
        if (head) sections.push({ kind: "same", rows: run.slice(0, head), id: -k - 1 });
        sections.push({ kind: "folded", count: hidden, id: k });
        if (tail) sections.push({ kind: "same", rows: run.slice(run.length - tail), id: -k - 100000 });
      }
    }
    k = end;
  }

  return sections;
}
