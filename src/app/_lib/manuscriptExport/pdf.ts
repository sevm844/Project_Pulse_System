import { BODY_FONT, BODY_SIZE, HEADING_SIZE, headingsOf, marginsOf, placeCells, plainText, type Block, type ExportOptions, type Para, type Run, type TableBlock, type TitlePage } from "./model";

// The PDF is drawn by pdfmake from the shared model. Arimo, Tinos and Cousine are look-alikes of Arial, Times New Roman
// and Courier New with the very same letter widths, so lines and pages break where they would in the original fonts.
// They are downloaded only when someone exports (public/fonts/export).

type Node = Record<string, unknown>;

const FONT_FILES = {
  Arimo: "Arimo",
  Tinos: "Tinos",
  Cousine: "Cousine",
} as const;

const fontFamily = (name?: string): keyof typeof FONT_FILES => {
  const n = name ?? BODY_FONT;
  if (/courier|mono|consolas/i.test(n)) return "Cousine";
  if (/times|cambria|georgia|garamond|palatino|serif/i.test(n) && !/sans/i.test(n)) return "Tinos";

  return "Arimo";
};

const sizeOf = (para: Para) => (para.heading ? HEADING_SIZE[para.heading] : BODY_SIZE);

function inline(run: Run, para: Para): Node {
  const caps = para.heading === 1 || para.heading === 3;
  const node: Node = {
    text: caps ? run.text.toUpperCase() : run.text,
    font: fontFamily(run.font),
    fontSize: run.size ?? sizeOf(para),
  };
  if (run.bold || para.heading) node.bold = true;
  if (run.italic) node.italics = true;
  const decoration = [run.underline || run.href ? "underline" : "", run.strike ? "lineThrough" : ""].filter(Boolean);
  if (decoration.length) node.decoration = decoration;
  if (run.href) {
    node.link = run.href;
    node.color = run.color ?? "#1a56b3";
  } else if (run.color) node.color = run.color;
  if (run.highlight) node.background = run.highlight;
  if (run.sup) node.sup = true;
  if (run.sub) node.sub = true;

  return node;
}

// Space around a paragraph, in points, the same proportions as the editor.
function spacing(para: Para, inCell: boolean): [number, number, number, number] {
  if (inCell) return [0, 0, 0, 0];
  const size = sizeOf(para);
  if (para.heading === 1) return [0, 0.6 * size, 0, 0.4 * size];
  if (para.heading) return [0, 0.8 * size, 0, 0.3 * size];

  return [0, 0, 0, 0.4 * size];
}

function paragraph(para: Para, inCell: boolean): Node {
  const node: Node = {
    // An empty paragraph keeps its height, like a blank line in the editor.
    text: para.runs.length ? para.runs.map((r) => inline(r, para)) : [{ text: " ", fontSize: sizeOf(para) }],
    alignment: para.align ?? "left",
    lineHeight: para.heading ? 1.15 : para.lineHeight,
    margin: spacing(para, inCell),
  };
  if (para.indent) node.leadingIndent = para.indent;
  if (para.heading) {
    node.headlineLevel = para.heading;
    node.tocItem = true;
    node.tocMargin = [(para.heading - 1) * 14, 0, 0, 2];
  }

  return node;
}

function tableNode(table: TableBlock): Node | null {
  const { cols, rows, placed } = placeCells(table);
  if (cols === 0) return null;

  const body: Node[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({})));
  for (const { cell, r, c } of placed) {
    const stack = cell.blocks.length ? cell.blocks.map((b) => blockNode(b, true)).filter(Boolean) : [{ text: " " }];
    const node: Node = { stack, alignment: cell.align ?? "left" };
    if (cell.header) {
      node.bold = true;
      node.fillColor = "#f3f6f3";
    }
    if (cell.colSpan > 1) node.colSpan = Math.min(cell.colSpan, cols - c);
    if (cell.rowSpan > 1) node.rowSpan = Math.min(cell.rowSpan, rows - r);
    body[r][c] = node;
  }

  return {
    table: { widths: Array(cols).fill("*"), body, dontBreakRows: true, headerRows: table.rows[0]?.every((c) => c.header) ? 1 : 0 },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#777777",
      vLineColor: () => "#777777",
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 6, 0, 8],
  };
}

function blockNode(block: Block, inCell = false): Node | null {
  switch (block.t) {
    case "p":
      return paragraph(block, inCell);
    case "list": {
      const items = block.items.map((blocks) => {
        const nodes = blocks.map((b) => blockNode(b, true)).filter(Boolean);

        return nodes.length === 1 ? nodes[0] : { stack: nodes };
      });

      return { [block.ordered ? "ol" : "ul"]: items, margin: [0, 0, 0, inCell ? 0 : 5] };
    }
    case "table":
      return tableNode(block);
    case "image":
      return { image: block.src, width: block.width, height: block.height, alignment: "center", margin: [0, 6, 0, 6] };
    case "code":
      return {
        table: { widths: ["*"], body: [[{ text: block.text || " ", font: "Cousine", fontSize: 10, lineHeight: 1.2, fillColor: "#f4f6f4", preserveLeadingSpaces: true }]] },
        layout: "noBorders",
        margin: [0, 6, 0, 8],
      };
    case "quote":
      return { stack: block.blocks.map((b) => blockNode(b, true)).filter(Boolean), margin: [24, 4, 0, 8], color: "#444444", italics: true };
    case "break":
      return { text: "", pageBreak: "after" };
  }
}

function titlePage(page: TitlePage): Node[] {
  const centered = (text: string, extra: Node = {}): Node => ({ text, alignment: "center", fontSize: 12, lineHeight: 1.3, ...extra });
  const nodes: Node[] = [
    centered(page.institution.toUpperCase(), { bold: true, fontSize: 14, margin: [0, 40, 0, 4] }),
    centered(page.college, { margin: [0, 0, 0, 0] }),
    centered(page.kind, { margin: [0, 90, 0, 0] }),
    centered(page.title.toUpperCase(), { bold: true, fontSize: 16, lineHeight: 1.3, margin: [0, 28, 0, 28] }),
    centered(page.statement, { fontSize: 11, lineHeight: 1.5 }),
  ];

  if (page.authors.length) {
    nodes.push(centered("Submitted by:", { margin: [0, 48, 0, 6] }));
    page.authors.forEach((author) => nodes.push(centered(author, { bold: true })));
  }
  if (page.adviser) {
    nodes.push(centered("Adviser:", { margin: [0, 28, 0, 6] }));
    nodes.push(centered(page.adviser, { bold: true }));
  }
  if (page.date) nodes.push(centered(page.date, { margin: [0, 48, 0, 0] }));
  nodes.push({ text: "", pageBreak: "after" });

  return nodes;
}

// pdfmake with the three look-alike fonts registered; shared by the manuscript and the certificate.
export async function loadPdfMake() {
  const pdfMake = (await import("pdfmake/build/pdfmake")).default;
  const root = `${window.location.origin}/fonts/export/`;

  pdfMake.setUrlAccessPolicy((url: string) => url.startsWith(root) || url.startsWith("data:"));
  pdfMake.addFonts(
    Object.fromEntries(
      Object.values(FONT_FILES).map((name) => [
        name,
        { normal: `${root}${name}_400Regular.ttf`, bold: `${root}${name}_700Bold.ttf`, italics: `${root}${name}_400Regular_Italic.ttf`, bolditalics: `${root}${name}_700Bold_Italic.ttf` },
      ]),
    ),
  );

  return pdfMake;
}

// i, ii, iii... for the front pages.
function roman(value: number): string {
  const table: [number, string][] = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let rest = Math.max(1, value);
  let out = "";

  for (const [amount, letters] of table) {
    while (rest >= amount) {
      out += letters;
      rest -= amount;
    }
  }

  return out;
}

// The table of contents is written by hand (not by pdfmake's own) so the page numbers it shows are the ones printed at the foot of the pages: in the thesis layout the body
// starts again at 1, but pdfmake can only count real pages.
function contentsNodes(items: { level: 1 | 2 | 3; text: string; page: number }[]): Node[] {
  const lines = items.map((item, index): Node => ({
    // The last line tells which page the contents end on (the body starts on the next one).
    ...(index === items.length - 1 ? { id: "toc-end" } : {}),
    columns: [
      { text: item.level === 1 ? item.text.toUpperCase() : item.text, width: "*", bold: item.level === 1, fontSize: BODY_SIZE },
      { text: item.page > 0 ? String(item.page) : "", width: 36, alignment: "right", fontSize: BODY_SIZE },
    ],
    columnGap: 8,
    lineHeight: 1.15,
    margin: [(item.level - 1) * 18, item.level === 1 ? 8 : 2, 0, 2],
  }));

  return [{ text: "TABLE OF CONTENTS", bold: true, fontSize: 14, alignment: "center", margin: [0, 0, 0, 16] }, ...lines, { text: "", pageBreak: "after" }];
}

export async function buildPdf(blocks: Block[], options: ExportOptions): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  const layout = options.layout ?? "thesis";
  const thesis = layout === "thesis";
  const margins = marginsOf(layout);
  const headings = headingsOf(blocks);
  const wantsToc = options.toc && headings.length > 0;

  // Where things landed on the real pages. The pages are laid out once to find them, and again with the numbers written in (the table of contents has the same height both times).
  const seen = new Map<string, number>();
  const bodyStartOf = () => (wantsToc ? (seen.get("toc-end") ?? (options.titlePage ? 2 : 1)) + 1 : options.titlePage ? 2 : 1);

  function definitionFor(): Record<string, unknown> {
    const bodyStart = bodyStartOf();
    const shown = (real: number) => (thesis ? real - bodyStart + 1 : real);

    const content: Node[] = [];
    if (options.titlePage) content.push(...titlePage(options.titlePage));
    if (wantsToc) {
      content.push(...contentsNodes(headings.map((heading, index) => ({ ...heading, page: seen.has("h" + index) ? shown(seen.get("h" + index) as number) : 0 }))));
    }

    // Thesis layout: every chapter (Heading 1) starts on a new page, except the very first thing of the body (the contents already ended the page) or right after a page break.
    let first = true;
    let afterBreak = false;
    let headingIndex = 0;
    for (const block of blocks) {
      const node = blockNode(block);
      if (!node) continue;

      if (block.t === "p" && block.heading && plainText(block)) node.id = "h" + headingIndex++;
      // (a separate break, so the heading itself is still found on its page)
      if (thesis && block.t === "p" && block.heading === 1 && !first && !afterBreak) content.push({ text: "", pageBreak: "after" });

      first = false;
      afterBreak = block.t === "break";
      content.push(node);
    }
    if (content.length === 0) content.push({ text: " " });

    return {
      info: { title: options.titlePage?.title || options.fileName, author: "Project Pulse" },
      pageSize: "LETTER",
      pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
      defaultStyle: { font: "Arimo", fontSize: BODY_SIZE, lineHeight: 1.5 },
      content,
      // The title page carries no number. Thesis layout: the front pages (contents) are i, ii... and the body starts again at 1. Editor layout: the page's real position.
      footer: options.pageNumbers
        ? (page: number) => {
            if (options.titlePage && page === 1) return null;

            const text = !thesis ? String(page) : page < bodyStart ? roman(page - (options.titlePage ? 1 : 0)) : String(page - bodyStart + 1);

            return { text, alignment: "center", fontSize: 10, margin: [margins.left, 22, margins.right, 0] };
          }
        : undefined,
      // Notes the page each heading (and the start of the body) falls on. A heading never stands alone at the bottom of a page.
      pageBreakBefore: (node: { headlineLevel?: number; id?: string; startPosition?: { pageNumber: number } }, following: unknown[]) => {
        if (node.id && node.startPosition) seen.set(node.id, node.startPosition.pageNumber);

        return Boolean(node.headlineLevel) && following.length === 0;
      },
    };
  }

  if (wantsToc) await pdfMake.createPdf(definitionFor()).getBlob();

  return pdfMake.createPdf(definitionFor()).getBlob();
}
