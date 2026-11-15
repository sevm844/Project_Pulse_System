"use client";

import { Extension, EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useEffect, useMemo } from "react";
import type { Block } from "../../_lib/manuscriptDiff";
import { createManuscriptExtensions } from "./extensions";

// The paper of the review screen: the very same read-only editor, extensions and page layout the students write in (so fonts,
// tables, lists, pictures and page breaks are exactly what they typed), with the comments drawn on top of it.
//
// Comments are stored as "the n-th readable block of the version + characters inside it" (toBlocks in manuscriptDiff.ts). The
// map below walks the editor's document in the same order as toBlocks, so a block number and a character offset can be turned
// into a place in the page (to highlight it) and a selection on the page back into a block number and offsets (to comment on it).
// Nothing about how comments are stored changes.

export type PaperMark = { id: number; block: number; from: number; to: number; tone: "open" | "resolved" | "active" };
export type PaperPick = { block: number; start: number; end: number; quote: string; x: number; y: number };

type Ch = { c: string; pos: number };
type Mapped = { text: string; pos: number[] };

const squash = (chars: Ch[]): Ch[] => {
  const out: Ch[] = [];
  for (const ch of chars) {
    if (/\s/.test(ch.c)) {
      if (out.length > 0 && out[out.length - 1].c !== " ") out.push({ c: " ", pos: ch.pos });
    } else out.push(ch);
  }
  while (out.length > 0 && out[out.length - 1].c === " ") out.pop();

  return out;
};

// The characters of a node in reading order, each with the document position it sits at (a line break reads as a space).
function raw(node: PMNode, at: number, out: Ch[]) {
  if (node.isText) {
    const text = node.text ?? "";
    for (let i = 0; i < text.length; i++) out.push({ c: text[i], pos: at + i });
    return;
  }
  if (node.type.name === "hardBreak") {
    out.push({ c: " ", pos: at });
    return;
  }
  node.forEach((child, offset) => raw(child, at + 1 + offset, out));
}

const charsOf = (node: PMNode, at: number) => {
  const out: Ch[] = [];
  raw(node, at, out);

  return out;
};

function push(out: Mapped[], chars: Ch[]) {
  const clean = squash(chars);
  if (clean.length > 0) out.push({ text: clean.map((ch) => ch.c).join(""), pos: clean.map((ch) => ch.pos) });
}

// The same walk as toBlocks (manuscriptDiff.ts), over the editor's document.
function walk(node: PMNode, at: number, out: Mapped[]) {
  switch (node.type.name) {
    case "paragraph":
    case "heading":
    case "codeBlock":
      push(out, charsOf(node, at));
      return;
    case "bulletList":
    case "orderedList":
      node.forEach((item, itemOffset) => {
        item.forEach((child, childOffset) => walk(child, at + 1 + itemOffset + 1 + childOffset, out));
      });
      return;
    case "blockquote":
      node.forEach((child, offset) => push(out, charsOf(child, at + 1 + offset)));
      return;
    case "table":
      node.forEach((row, rowOffset) => {
        const rowAt = at + 1 + rowOffset;
        const joined: Ch[] = [];
        row.forEach((cell, cellOffset) => {
          const cells = squash(charsOf(cell, rowAt + 1 + cellOffset));
          if (cellOffset > 0) {
            const edge = joined.length > 0 ? joined[joined.length - 1].pos + 1 : rowAt + 1;
            for (const c of "  |  ") joined.push({ c, pos: edge });
          }
          joined.push(...cells);
        });
        push(out, joined);
      });
      return;
    case "image": {
      const text = String(node.attrs?.alt ?? "").replace(/\s+/g, " ").trim() || "Picture";
      out.push({ text, pos: Array.from({ length: text.length }, () => at) });
      return;
    }
    default:
      return;
  }
}

function buildMap(doc: PMNode): Mapped[] {
  const out: Mapped[] = [];
  doc.forEach((child, offset) => walk(child, offset, out));

  return out;
}

const marksKey = new PluginKey("reviewMarks");
type Placed = { id: number; from: number; to: number; tone: PaperMark["tone"] };

// Draws the comments' words (amber while open, soft green once resolved, stronger while chosen) over the page.
const commentMarks = () =>
  Extension.create({
    name: "reviewMarks",
    addProseMirrorPlugins() {
      return [
        new Plugin<Placed[]>({
          key: marksKey,
          // The places to draw arrive as a transaction (see ReviewPaper); the document itself never changes.
          state: {
            init: () => [],
            apply: (tr, value) => (tr.getMeta(marksKey) as Placed[] | undefined) ?? value,
          },
          props: {
            decorations: (state) =>
              DecorationSet.create(
                state.doc,
                (marksKey.getState(state) as Placed[])
                  .filter((m) => m.from < m.to && m.to <= state.doc.content.size)
                  .map((m) => Decoration.inline(m.from, m.to, { class: `rv-mark rv-${m.tone}`, "data-mark": String(m.id) })),
              ),
          },
        }),
      ];
    },
  });

export default function ReviewPaper({
  content,
  blocks,
  marks,
  canComment,
  onPages,
  onSelect,
  onMarkClick,
}: {
  content: JSONContent;
  blocks: Block[];
  marks: PaperMark[];
  canComment: boolean;
  onPages: (pages: number) => void;
  onSelect: (pick: PaperPick | null) => void;
  onMarkClick: (id: number) => void;
}) {
  const extensions = useMemo(() => [...createManuscriptExtensions(onPages), commentMarks()], [onPages]);

  const editor = useEditor({
    extensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "manuscript-sheet", "aria-label": "Manuscript version" } },
  });

  // Each block of the page, only trusted while its words are exactly the words toBlocks found (so a comment can never land on the wrong text).
  const map = useMemo(() => {
    if (!editor) return null;
    const mapped = buildMap(editor.state.doc);

    return mapped.map((block, i) => (blocks[i] && blocks[i].text === block.text ? block : null));
  }, [editor, blocks]);

  const placed = useMemo<Placed[]>(() => {
    if (!map) return [];

    return marks.flatMap((m) => {
      const block = map[m.block];
      const from = Math.max(0, m.from);
      const to = Math.min(block?.text.length ?? 0, m.to);

      return block && to > from ? [{ id: m.id, from: block.pos[from], to: block.pos[to - 1] + 1, tone: m.tone }] : [];
    });
  }, [map, marks]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    try {
      editor.view.dispatch(editor.state.tr.setMeta(marksKey, placed).setMeta("addToHistory", false));
    } catch {
      // The page is not on screen yet; the marks are drawn when it is.
    }
  }, [editor, placed]);

  // Words selected on the page -> the block and the characters inside it. Mouse, finger and keyboard all end as a change of the
  // selection, so that is what is listened to (a moment later, while a finger is still dragging a handle).
  useEffect(() => {
    if (!editor || !map || !canComment) return;
    let timer: number | undefined;

    const locate = (position: number): { block: number; offset: number } | null => {
      let low = 0;
      let high = map.length - 1;
      let found = -1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        const first = map[mid]?.pos[0];
        if (first !== undefined && first <= position) {
          found = mid;
          low = mid + 1;
        } else high = mid - 1;
      }

      // The map holds null for a block that cannot be trusted; look at the nearest trusted one around it instead of guessing.
      const real = (index: number) => map[index] ?? null;
      if (found < 0) return real(0) ? { block: 0, offset: 0 } : null;
      const block = real(found);
      if (!block) return null;
      if (position > block.pos[block.pos.length - 1] + 1) return real(found + 1) ? { block: found + 1, offset: 0 } : { block: found, offset: block.text.length };
      const at = block.pos.findIndex((p) => p >= position);

      return { block: found, offset: at < 0 ? block.text.length : at };
    };

    const read = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return onSelect(null);

      const range = selection.getRangeAt(0);
      const view = editor.view;
      if (!view.dom.contains(range.startContainer)) return onSelect(null);

      let from: number;
      let to: number;
      try {
        from = view.posAtDOM(range.startContainer, range.startOffset);
        to = view.dom.contains(range.endContainer) ? view.posAtDOM(range.endContainer, range.endOffset) : from;
      } catch {
        return onSelect(null);
      }

      const first = locate(from);
      const last = locate(to);
      if (!first || !last) return onSelect(null);

      const text = blocks[first.block]?.text ?? "";
      let start = first.offset;
      // A selection that runs on into the next paragraph is cut at the end of the first one.
      let end = last.block === first.block ? last.offset : text.length;
      while (start < end && /\s/.test(text[start])) start++;
      while (end > start && /\s/.test(text[end - 1])) end--;
      if (end - start < 1) return onSelect(null);

      const rect = range.getBoundingClientRect();
      onSelect({
        block: first.block,
        start,
        end,
        quote: text.slice(start, Math.min(end, start + 600)),
        x: Math.min(rect.right, window.innerWidth - 150),
        y: rect.bottom + 8,
      });
    };

    const onChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(read, 200);
    };
    document.addEventListener("selectionchange", onChange);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("selectionchange", onChange);
    };
  }, [editor, map, blocks, canComment, onSelect]);

  return (
    <div
      onClick={(event) => {
        const mark = (event.target as HTMLElement).closest<HTMLElement>("[data-mark]");
        if (mark) onMarkClick(Number(mark.dataset.mark));
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
