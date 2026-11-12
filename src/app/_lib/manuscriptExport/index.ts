import type { JSONContent } from "@tiptap/react";
import { blocksFromDocument, measurePictures, pictureSources, type ExportOptions } from "./model";

export type { ExportOptions, TitlePage } from "./model";
export type ExportFormat = "pdf" | "docx";

// Turn a manuscript into a PDF or Word file and hand it to the browser as a download. Everything happens in the
// browser from the saved document; nothing is sent anywhere.
export async function exportManuscript(content: JSONContent, format: ExportFormat, options: ExportOptions): Promise<void> {
  const blocks = blocksFromDocument(content, await measurePictures(pictureSources(content)));
  const blob = format === "pdf" ? await (await import("./pdf")).buildPdf(blocks, options) : await (await import("./docx")).buildDocx(blocks, options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(options.fileName)}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// A name any computer accepts.
export const safeFileName = (name: string) => name.replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Manuscript";
