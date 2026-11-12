import { BODY_FONT, BODY_SIZE, HEADING_SIZE, decodePicture, headingsOf, placeCells, type Block, type ExportOptions, type Para, type Run, type TableBlock, type TitlePage } from "./model";

// The Word file is written by the `docx` library from the shared model. Fonts keep the names the student chose, headings
// use Word's own Heading 1-3 styles (so the table of contents and Word's navigation pane work), and lists are real lists.

type D = typeof import("docx");
type Child = InstanceType<D["Paragraph"]> | InstanceType<D["Table"]> | InstanceType<D["TableOfContents"]>;

const TWIP = 20; // twips per point
const PAGE = { width: 12240, height: 15840, margin: 1440 };
const CONTENT_TWIPS = PAGE.width - 2 * PAGE.margin; // 9360
const noHash = (color?: string) => color?.replace("#", "").toUpperCase();

export async function buildDocx(blocks: Block[], options: ExportOptions): Promise<Blob> {
  const d = await import("docx");
  let ordered = 0; // every numbered list starts again at 1

  const alignment = (align?: string) =>
    align === "center" ? d.AlignmentType.CENTER : align === "right" ? d.AlignmentType.RIGHT : align === "justify" ? d.AlignmentType.JUSTIFIED : d.AlignmentType.LEFT;

  function runs(para: Para): (InstanceType<D["TextRun"]> | InstanceType<D["ExternalHyperlink"]>)[] {
    const caps = para.heading === 1 || para.heading === 3;

    return para.runs.map((run: Run) => {
      if (run.text === "\n") return new d.TextRun({ break: 1 });
      const text = new d.TextRun({
        text: run.text,
        font: run.font ?? BODY_FONT,
        size: Math.round((run.size ?? (para.heading ? HEADING_SIZE[para.heading] : BODY_SIZE)) * 2),
        bold: run.bold || Boolean(para.heading) || undefined,
        italics: run.italic || undefined,
        underline: run.underline || run.href ? { type: d.UnderlineType.SINGLE } : undefined,
        strike: run.strike || undefined,
        superScript: run.sup || undefined,
        subScript: run.sub || undefined,
        color: run.href ? (noHash(run.color) ?? "1A56B3") : noHash(run.color),
        shading: run.highlight ? { type: d.ShadingType.CLEAR, fill: noHash(run.highlight), color: "auto" } : undefined,
        allCaps: caps || undefined,
      });

      return run.href ? new d.ExternalHyperlink({ link: run.href, children: [text] }) : text;
    });
  }

  type Context = { left?: number; quote?: boolean; list?: { ordered: boolean; level: number; instance: number }; inCell?: boolean };

  function paragraph(para: Para, ctx: Context): InstanceType<D["Paragraph"]> {
    const size = para.heading ? HEADING_SIZE[para.heading] : BODY_SIZE;
    const after = ctx.inCell || ctx.list ? 0 : Math.round(0.4 * size * TWIP);
    const headingStyle = para.heading ? ([d.HeadingLevel.HEADING_1, d.HeadingLevel.HEADING_2, d.HeadingLevel.HEADING_3] as const)[para.heading - 1] : undefined;

    return new d.Paragraph({
      heading: headingStyle,
      keepNext: para.heading ? true : undefined,
      alignment: alignment(para.align),
      spacing: {
        line: Math.round(240 * (para.heading ? 1.15 : para.lineHeight)),
        lineRule: d.LineRuleType.AUTO,
        after,
        before: para.heading ? Math.round((para.heading === 1 ? 0.6 : 0.8) * size * TWIP) : 0,
      },
      indent: ctx.quote ? { left: 480, firstLine: para.indent ? Math.round(para.indent * TWIP) : undefined } : para.indent ? { firstLine: Math.round(para.indent * TWIP) } : undefined,
      border: ctx.quote ? { left: { style: d.BorderStyle.SINGLE, size: 12, color: "C5CDC7", space: 8 } } : undefined,
      numbering: ctx.list ? { reference: ctx.list.ordered ? "ordered" : "bullets", level: ctx.list.level, instance: ctx.list.instance } : undefined,
      children: runs(para),
    });
  }

  function table(block: TableBlock): InstanceType<D["Table"]> | null {
    const { cols } = placeCells(block);
    if (cols === 0) return null;

    const width = Math.floor(CONTENT_TWIPS / cols);
    const line = { style: d.BorderStyle.SINGLE, size: 4, color: "777777" };

    return new d.Table({
      width: { size: CONTENT_TWIPS, type: d.WidthType.DXA },
      columnWidths: Array(cols).fill(width),
      borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line },
      rows: block.rows.map(
        (row, r) =>
          new d.TableRow({
            tableHeader: r === 0 && row.every((c) => c.header),
            cantSplit: true,
            children: row.map((cell) => {
              const inner = cell.blocks.flatMap((b) => toChildren(b, { inCell: true }));

              return new d.TableCell({
                width: { size: width * cell.colSpan, type: d.WidthType.DXA },
                columnSpan: cell.colSpan > 1 ? cell.colSpan : undefined,
                rowSpan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
                shading: cell.header ? { type: d.ShadingType.CLEAR, fill: "F3F6F3", color: "auto" } : undefined,
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: (inner.length ? inner : [new d.Paragraph({})]).map((c) => c as InstanceType<D["Paragraph"]>),
              });
            }),
          }),
      ),
    });
  }

  function toChildren(block: Block, ctx: Context = {}): Child[] {
    switch (block.t) {
      case "p":
        return [paragraph(block, ctx)];
      case "list": {
        const level = ctx.list ? ctx.list.level + 1 : 0;
        const instance = block.ordered ? ++ordered : 0;

        return block.items.flatMap((item) =>
          item.flatMap((child, i) => (child.t === "p" ? [paragraph(child, { ...ctx, list: i === 0 ? { ordered: block.ordered, level: Math.min(level, 3), instance } : undefined, left: (level + 1) * 360 })] : toChildren(child, { ...ctx, list: { ordered: block.ordered, level: Math.min(level, 3), instance } }))),
        );
      }
      case "table": {
        const t = table(block);

        // Word wants a paragraph after a table
        return t ? [t, new d.Paragraph({ spacing: { after: 120 } })] : [];
      }
      case "image": {
        const { bytes, type } = decodePicture(block.src);

        return [
          new d.Paragraph({
            alignment: d.AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [new d.ImageRun({ type, data: bytes, transformation: { width: Math.round((block.width * 4) / 3), height: Math.round((block.height * 4) / 3) } })],
          }),
        ];
      }
      case "code":
        return block.text.split("\n").map(
          (line) =>
            new d.Paragraph({
              spacing: { line: 276, lineRule: d.LineRuleType.AUTO, after: 0 },
              shading: { type: d.ShadingType.CLEAR, fill: "F4F6F4", color: "auto" },
              children: [new d.TextRun({ text: line || " ", font: "Courier New", size: 20 })],
            }),
        );
      case "quote":
        return block.blocks.flatMap((b) => toChildren(b, { ...ctx, quote: true }));
      case "break":
        return [new d.Paragraph({ children: [new d.PageBreak()] })];
    }
  }

  function titlePage(page: TitlePage): Child[] {
    const line = (text: string, size = 12, extra: { bold?: boolean; before?: number; after?: number } = {}) =>
      new d.Paragraph({
        alignment: d.AlignmentType.CENTER,
        spacing: { before: extra.before ?? 0, after: extra.after ?? 0, line: 312, lineRule: d.LineRuleType.AUTO },
        children: text.split("\n").flatMap((part, i) => [...(i ? [new d.TextRun({ break: 1 })] : []), new d.TextRun({ text: part, font: BODY_FONT, size: size * 2, bold: extra.bold })]),
      });

    const out: Child[] = [
      line(page.institution.toUpperCase(), 14, { bold: true, before: 800, after: 80 }),
      line(page.college),
      line(page.kind, 12, { before: 1800 }),
      line(page.title.toUpperCase(), 16, { bold: true, before: 560, after: 560 }),
      line(page.statement, 11),
    ];
    if (page.authors.length) {
      out.push(line("Submitted by:", 12, { before: 960, after: 120 }));
      page.authors.forEach((author) => out.push(line(author, 12, { bold: true })));
    }
    if (page.adviser) {
      out.push(line("Adviser:", 12, { before: 560, after: 120 }));
      out.push(line(page.adviser, 12, { bold: true }));
    }
    if (page.date) out.push(line(page.date, 12, { before: 960 }));

    return out;
  }

  const pageProperties = { page: { size: { width: PAGE.width, height: PAGE.height }, margin: { top: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, footer: 720 } } };
  const wantsToc = options.toc && headingsOf(blocks).length > 0;

  const body: Child[] = [];
  if (wantsToc) {
    body.push(
      new d.Paragraph({
        alignment: d.AlignmentType.CENTER,
        spacing: { after: 320 },
        children: [new d.TextRun({ text: "TABLE OF CONTENTS", font: BODY_FONT, size: 28, bold: true })],
      }),
      new d.TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
      new d.Paragraph({ children: [new d.PageBreak()] }),
    );
  }
  for (const block of blocks) body.push(...toChildren(block));
  if (body.length === 0) body.push(new d.Paragraph({}));

  const footer = new d.Footer({
    children: [new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [new d.TextRun({ children: [d.PageNumber.CURRENT], font: BODY_FONT, size: 20 })] })],
  });

  const heading = (id: string, name: string, size: number, extra: { caps?: boolean; center?: boolean; before: number; after: number }) => ({
    id,
    name,
    basedOn: "Normal",
    next: "Normal",
    quickFormat: true,
    run: { font: BODY_FONT, size: size * 2, bold: true, color: "000000", allCaps: extra.caps },
    paragraph: { alignment: extra.center ? d.AlignmentType.CENTER : d.AlignmentType.LEFT, spacing: { before: extra.before, after: extra.after } },
  });

  const levels = (format: "bullet" | "decimal") =>
    [0, 1, 2, 3].map((level) => ({
      level,
      format: format === "bullet" ? d.LevelFormat.BULLET : d.LevelFormat.DECIMAL,
      text: format === "bullet" ? (level % 2 ? "–" : "•") : `%${level + 1}.`,
      alignment: d.AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540 + level * 360, hanging: 360 } } },
    }));

  const document = new d.Document({
    creator: "Project Pulse",
    title: options.titlePage?.title || options.fileName,
    features: wantsToc ? { updateFields: true } : undefined,
    styles: {
      default: { document: { run: { font: BODY_FONT, size: BODY_SIZE * 2 }, paragraph: { spacing: { line: 360, lineRule: d.LineRuleType.AUTO } } } },
      paragraphStyles: [
        heading("Heading1", "heading 1", HEADING_SIZE[1], { caps: true, center: true, before: 200, after: 120 }),
        heading("Heading2", "heading 2", HEADING_SIZE[2], { before: 240, after: 80 }),
        heading("Heading3", "heading 3", HEADING_SIZE[3], { caps: true, before: 240, after: 80 }),
      ],
    },
    numbering: { config: [{ reference: "bullets", levels: levels("bullet") }, { reference: "ordered", levels: levels("decimal") }] },
    sections: [
      ...(options.titlePage ? [{ properties: pageProperties, children: titlePage(options.titlePage) }] : []),
      { properties: pageProperties, footers: options.pageNumbers ? { default: footer } : undefined, children: body },
    ],
  });

  return d.Packer.toBlob(document);
}
