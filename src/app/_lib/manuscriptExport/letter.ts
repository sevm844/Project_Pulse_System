import type { JSONContent } from "@tiptap/react";
import { saveBlob, safeFileName } from "./index";
import { loadPdfMake } from "./pdf";

// The letter for interview as a PDF to print: Letter size, one inch margins, Arial-like type. The text is the editor's saved JSON.
// Justified paragraphs (the body of the letter) get the indented first line the school's sample has; the rest stay left.

type Run = { text: string; bold?: boolean; italics?: boolean; decoration?: "underline" };

const runsOf = (node: JSONContent): Run[] =>
  (node.content ?? []).map((child) => {
    if (child.type === "hardBreak") return { text: "\n" };
    const marks = (child.marks ?? []).map((mark) => mark.type);

    return {
      text: child.text ?? "",
      ...(marks.includes("bold") ? { bold: true } : {}),
      ...(marks.includes("italic") ? { italics: true } : {}),
      ...(marks.includes("underline") ? { decoration: "underline" as const } : {}),
    };
  });

function blockNode(node: JSONContent): unknown {
  if (node.type === "bulletList" || node.type === "orderedList") {
    const items = (node.content ?? []).map((item) => ({ stack: (item.content ?? []).map(blockNode) }));

    return node.type === "bulletList" ? { ul: items, margin: [18, 0, 0, 10] } : { ol: items, margin: [18, 0, 0, 10] };
  }

  const runs = runsOf(node);
  const justified = node.attrs?.textAlign === "justify";

  if (runs.length === 0 || runs.every((run) => run.text === "")) return { text: " ", margin: [0, 0, 0, 6] };

  return justified
    ? { text: runs, alignment: "justify", leadingIndent: 36, lineHeight: 1.4, margin: [0, 0, 0, 12] }
    : { text: runs, lineHeight: 1.15, margin: [0, 0, 0, 8] };
}

export async function buildLetterPdf(content: JSONContent, title: string): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  const blocks = (content.content ?? []).map(blockNode);

  return pdfMake
    .createPdf({
      info: { title, author: "Project Pulse" },
      pageSize: "LETTER",
      pageMargins: [72, 72, 72, 72],
      defaultStyle: { font: "Arimo", fontSize: 12 },
      content: blocks.length > 0 ? blocks : [{ text: " " }],
    })
    .getBlob();
}

export async function downloadLetterPdf(content: JSONContent, name: string) {
  saveBlob(await buildLetterPdf(content, name), `${safeFileName(name)}.pdf`);
}
