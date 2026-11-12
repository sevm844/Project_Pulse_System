import type { JSONContent } from "@tiptap/react";

// What a PDF or Word file needs to know about a manuscript, read from the editor's saved JSON. The two file writers
// (pdf.ts, docx.ts) share this, so both come out the same. Sizes are in points (1/72 inch), like the editor's fonts.

export type Align = "left" | "center" | "right" | "justify";

export type Run = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  sup?: boolean;
  sub?: boolean;
  color?: string; // #rrggbb
  highlight?: string; // #rrggbb
  font?: string; // the name the student picked ("Times New Roman")
  size?: number; // pt
  href?: string;
};

export type Para = {
  t: "p";
  runs: Run[];
  align?: Align;
  lineHeight: number; // lines, the way Word and Google Docs count them (1, 1.15, 1.5, 2)
  indent: number; // first-line indent, pt
  heading?: 1 | 2 | 3;
};
export type ListBlock = { t: "list"; ordered: boolean; items: Block[][] };
export type Cell = { header: boolean; colSpan: number; rowSpan: number; align?: Align; blocks: Block[] };
export type TableBlock = { t: "table"; rows: Cell[][] };
export type ImageBlock = { t: "image"; src: string; width: number; height: number };
export type CodeBlock = { t: "code"; text: string };
export type QuoteBlock = { t: "quote"; blocks: Block[] };
export type BreakBlock = { t: "break" };
export type Block = Para | ListBlock | TableBlock | ImageBlock | CodeBlock | QuoteBlock | BreakBlock;

export const BODY_FONT = "Arial";
export const BODY_SIZE = 11;
export const HEADING_SIZE = { 1: 14, 2: 12, 3: 11 } as const;
// Letter paper, 1 inch margins: the widest a picture or table can be, in points.
export const CONTENT_WIDTH = 468;
const MAX_IMAGE_HEIGHT = 600;

type Size = { w: number; h: number };
export type ImageSizes = Map<string, Size>;

const toPt = (value: string | null | undefined): number => {
  const m = /^(\d*\.?\d+)(pt|px|in|cm)$/.exec((value ?? "").trim());
  if (!m) return 0;
  const n = parseFloat(m[1]);

  return m[2] === "in" ? n * 72 : m[2] === "cm" ? n * 28.3465 : m[2] === "px" ? n * 0.75 : n;
};

const ALIGNS = new Set(["left", "center", "right", "justify"]);
const hex = (value: unknown): string | undefined => (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : undefined);

function runsOf(node: JSONContent, base: Partial<Run> = {}): Run[] {
  const out: Run[] = [];

  for (const child of node.content ?? []) {
    if (child.type === "hardBreak") {
      out.push({ ...base, text: "\n" });
      continue;
    }
    if (child.type !== "text" || !child.text) continue;

    const run: Run = { ...base, text: child.text };
    for (const mark of child.marks ?? []) {
      const attrs = mark.attrs ?? {};
      if (mark.type === "bold") run.bold = true;
      else if (mark.type === "italic") run.italic = true;
      else if (mark.type === "underline") run.underline = true;
      else if (mark.type === "strike") run.strike = true;
      else if (mark.type === "superscript") run.sup = true;
      else if (mark.type === "subscript") run.sub = true;
      else if (mark.type === "code") run.font = "Courier New";
      else if (mark.type === "highlight") run.highlight = hex(attrs.color) ?? "#fff59d";
      else if (mark.type === "link" && typeof attrs.href === "string") run.href = attrs.href;
      else if (mark.type === "textStyle") {
        const family = typeof attrs.fontFamily === "string" ? attrs.fontFamily.split(",")[0].replace(/["']/g, "").trim() : "";
        if (family) run.font = family;
        const size = typeof attrs.fontSize === "string" ? parseFloat(attrs.fontSize) : NaN;
        if (size > 0) run.size = size;
        if (hex(attrs.color)) run.color = hex(attrs.color);
      }
    }
    out.push(run);
  }

  return out;
}

function paragraph(node: JSONContent): Para {
  const level = node.type === "heading" ? (Math.min(3, Math.max(1, Number(node.attrs?.level) || 1)) as 1 | 2 | 3) : undefined;
  const align = ALIGNS.has(String(node.attrs?.textAlign)) ? (node.attrs?.textAlign as Align) : level === 1 ? "center" : undefined;
  const spacing = parseFloat(String(node.attrs?.lineHeight ?? ""));

  return {
    t: "p",
    runs: runsOf(node),
    align,
    lineHeight: spacing >= 0.5 && spacing <= 5 ? spacing : 1.5,
    indent: toPt(typeof node.attrs?.textIndent === "string" ? node.attrs.textIndent : null),
    heading: level,
  };
}

const dataUrl = /^data:image\/(png|jpe?g|gif);base64,/i;

// Every picture in the document, so the writers can be given their real shape before they start.
export function pictureSources(doc: JSONContent | undefined): string[] {
  const found = new Set<string>();
  const visit = (node: JSONContent) => {
    if (node.type === "image" && typeof node.attrs?.src === "string" && dataUrl.test(node.attrs.src)) found.add(node.attrs.src);
    node.content?.forEach(visit);
  };
  if (doc) visit(doc);

  return [...found];
}

function blocksOf(nodes: JSONContent[] | undefined, sizes: ImageSizes): Block[] {
  const out: Block[] = [];

  for (const node of nodes ?? []) {
    switch (node.type) {
      case "paragraph":
      case "heading":
        out.push(paragraph(node));
        break;
      case "bulletList":
      case "orderedList":
        out.push({
          t: "list",
          ordered: node.type === "orderedList",
          items: (node.content ?? []).map((item) => blocksOf(item.content, sizes)),
        });
        break;
      case "blockquote":
        out.push({ t: "quote", blocks: blocksOf(node.content, sizes) });
        break;
      case "codeBlock":
        out.push({ t: "code", text: (node.content ?? []).map((c) => c.text ?? "").join("") });
        break;
      case "pageBreak":
        out.push({ t: "break" });
        break;
      case "image": {
        const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
        const natural = sizes.get(src);
        if (!natural) break;

        // The width the student gave it (px on screen), else its own size; never wider than the page or taller than most of it.
        const wanted = Number(node.attrs?.width) > 0 ? Number(node.attrs?.width) * 0.75 : natural.w * 0.75;
        let width = Math.min(wanted, CONTENT_WIDTH);
        let height = (width * natural.h) / natural.w;
        if (height > MAX_IMAGE_HEIGHT) {
          height = MAX_IMAGE_HEIGHT;
          width = (height * natural.w) / natural.h;
        }
        out.push({ t: "image", src, width, height });
        break;
      }
      case "table":
        out.push({
          t: "table",
          rows: (node.content ?? []).map((row) =>
            (row.content ?? []).map((cell) => ({
              header: cell.type === "tableHeader",
              colSpan: Math.max(1, Number(cell.attrs?.colspan) || 1),
              rowSpan: Math.max(1, Number(cell.attrs?.rowspan) || 1),
              align: ALIGNS.has(String(cell.attrs?.align)) ? (cell.attrs?.align as Align) : undefined,
              blocks: blocksOf(cell.content, sizes),
            })),
          ),
        });
        break;
      default:
        break;
    }
  }

  return out;
}

// Where each table cell sits on the grid once row spans are counted: the covered slots are not cells of the later rows.
export function placeCells(table: TableBlock) {
  const taken: boolean[][] = [];
  const placed: { cell: Cell; r: number; c: number }[] = [];
  let cols = 0;

  table.rows.forEach((row, r) => {
    taken[r] ??= [];
    let c = 0;
    for (const cell of row) {
      while (taken[r][c]) c++;
      placed.push({ cell, r, c });
      for (let dr = 0; dr < cell.rowSpan; dr++) for (let dc = 0; dc < cell.colSpan; dc++) (taken[r + dr] ??= [])[c + dc] = true;
      c += cell.colSpan;
      cols = Math.max(cols, c);
    }
  });

  return { cols, rows: table.rows.length, placed };
}

export const blocksFromDocument = (doc: JSONContent | undefined, sizes: ImageSizes): Block[] => blocksOf(doc?.content, sizes);

export const plainText = (para: Para) => para.runs.map((r) => r.text).join("").replace(/\s+/g, " ").trim();

// Headings in reading order: they make the table of contents.
export function headingsOf(blocks: Block[]): { level: 1 | 2 | 3; text: string }[] {
  return blocks.flatMap((b) => (b.t === "p" && b.heading && plainText(b) ? [{ level: b.heading, text: plainText(b) }] : []));
}

// ---- the title page and file options

export type TitlePage = {
  institution: string;
  college: string;
  kind: string; // "A Capstone Project"
  title: string;
  statement: string; // "Presented to the Faculty of ... In Partial Fulfillment of ..."
  authors: string[];
  adviser: string;
  date: string;
};

export type ExportOptions = {
  titlePage: TitlePage | null;
  toc: boolean;
  pageNumbers: boolean;
  fileName: string; // without the extension
};

// Real image sizes, read in the browser.
export async function measurePictures(sources: string[]): Promise<ImageSizes> {
  const sizes: ImageSizes = new Map();

  for (const src of sources) {
    const bitmap = await createImageBitmap(await (await fetch(src)).blob());
    sizes.set(src, { w: bitmap.width, h: bitmap.height });
    bitmap.close();
  }

  return sizes;
}

export function decodePicture(src: string): { bytes: Uint8Array; type: "png" | "jpg" | "gif" } {
  const match = /^data:image\/(png|jpe?g|gif);base64,([\s\S]*)$/i.exec(src);
  const binary = atob((match?.[2] ?? "").replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const kind = (match?.[1] ?? "png").toLowerCase();

  return { bytes, type: kind.startsWith("jp") ? "jpg" : (kind as "png" | "gif") };
}
