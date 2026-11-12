import { BODY_FONT, BODY_SIZE, HEADING_SIZE, headingsOf, placeCells, type Block, type ExportOptions, type Para, type Run, type TableBlock, type TitlePage } from "./model";

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

export async function buildPdf(blocks: Block[], options: ExportOptions): Promise<Blob> {
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

  const content: Node[] = [];
  if (options.titlePage) content.push(...titlePage(options.titlePage));
  if (options.toc && headingsOf(blocks).length > 0) {
    content.push({ toc: { title: { text: "TABLE OF CONTENTS", bold: true, fontSize: 14, alignment: "center", margin: [0, 0, 0, 16] } } }, { text: "", pageBreak: "after" });
  }
  for (const block of blocks) {
    const node = blockNode(block);
    if (node) content.push(node);
  }
  if (content.length === 0) content.push({ text: " " });

  const definition = {
    info: { title: options.titlePage?.title || options.fileName, author: "Project Pulse" },
    pageSize: "LETTER",
    pageMargins: [72, 72, 72, 72],
    defaultStyle: { font: "Arimo", fontSize: BODY_SIZE, lineHeight: 1.5 },
    content,
    // The title page carries no number; the rest are numbered with the page's real position.
    footer: options.pageNumbers
      ? (page: number) => (options.titlePage && page === 1 ? null : { text: String(page), alignment: "center", fontSize: 10, margin: [72, 22, 72, 0] })
      : undefined,
    // A heading never stands alone at the bottom of a page.
    pageBreakBefore: (node: { headlineLevel?: number }, following: unknown[]) => Boolean(node.headlineLevel) && following.length === 0,
  };

  return pdfMake.createPdf(definition).getBlob();
}
