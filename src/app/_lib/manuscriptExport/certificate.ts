import { segments, type CertificateFields, type CertificateTemplate } from "../certificates";
import { saveBlob, safeFileName } from "./index";
import { loadPdfMake } from "./pdf";

// The certificate as a PDF or a Word file, laid out like the university form F-RPO-09: logo and form code on top, the
// revision line, the title, the fixed wording with the group's own parts in bold, then the editor's signature block.

export type CertificateData = {
  template: CertificateTemplate;
  fields: CertificateFields;
  number: string | null; // null while it is only being prepared
  editorName: string;
  signature: string | null; // a picture, as a data URL
};

const LOGO_URL = "/certificate/ub-rpo-logo.png";
const LOGO_RATIO = 922 / 2000; // the logo's own height / width
const DASHES = "----------------------------------------";

async function pictureBytes(source: string): Promise<{ bytes: Uint8Array; type: "png" | "jpg" }> {
  const buffer = new Uint8Array(await (await fetch(source)).arrayBuffer());

  return { bytes: buffer, type: buffer[0] === 0xff ? "jpg" : "png" };
}

const dataUrlOf = async (url: string) =>
  new Promise<string>(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(await (await fetch(url)).blob());
  });

// A paragraph of the wording as runs: ordinary text, and the group's fill-in fields in bold.
const runsOf = (paragraph: string, fields: CertificateFields) =>
  segments(paragraph).map((s) => (s.field ? { text: fields[s.field], bold: true } : { text: s.text, bold: false }));

async function signatureSize(signature: string): Promise<{ w: number; h: number }> {
  const bitmap = await createImageBitmap(await (await fetch(signature)).blob());
  const scale = Math.min(1, 200 / bitmap.width, 70 / bitmap.height);
  const size = { w: Math.round(bitmap.width * scale), h: Math.round(bitmap.height * scale) };
  bitmap.close();

  return size;
}

export async function buildCertificatePdf(data: CertificateData): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  const { template: t, fields } = data;
  const logo = await dataUrlOf(LOGO_URL);
  const sign = data.signature ? await signatureSize(data.signature) : null;
  const hairline = { hLineWidth: (i: number) => (i === 0 || i === 1 ? 0.75 : 0), vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 3, paddingBottom: () => 3 };

  const content: unknown[] = [
    { columns: [{ image: logo, width: 190 }, { text: t.header.form_code, bold: true, fontSize: 11, alignment: "right" }], margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["*", "*", "*"],
        body: [[
          { text: `Revision No.: ${t.header.revision_no}`, alignment: "left" },
          { text: `Issue Date: ${t.header.issue_date}`, alignment: "center" },
          { text: `Revision Date: ${t.header.revision_date}`, alignment: "right" },
        ]],
      },
      layout: hairline,
      fontSize: 9,
      margin: [0, 0, 0, 30],
    },
    { text: t.title, bold: true, fontSize: 12, alignment: "center", margin: [0, 0, 0, 20] },
    ...t.paragraphs.map((p) => ({ text: runsOf(p, fields), alignment: "justify", lineHeight: 1.5, leadingIndent: 36, margin: [0, 0, 0, 14] })),
    { text: t.certified_by, margin: [0, 18, 0, 6] },
    sign ? { image: data.signature, width: sign.w, height: sign.h, margin: [0, 0, 0, 2] } : { text: " ", margin: [0, 0, 0, 44] },
    { text: data.editorName.toUpperCase(), bold: true },
    { text: DASHES },
    { text: t.signature_label },
    { text: [`${t.date_signed_label}  `, { text: fields.signed_date, bold: true }], margin: [0, 16, 0, 0] },
  ];

  const definition = {
    info: { title: `${t.title} ${data.number ?? ""}`.trim(), author: "Project Pulse" },
    pageSize: "LETTER",
    pageMargins: [72, 54, 72, 72],
    defaultStyle: { font: "Arimo", fontSize: 12 },
    content,
    footer: data.number ? { text: `Certificate No. ${data.number}`, alignment: "right", fontSize: 8, color: "#777777", margin: [72, 0, 72, 0] } : undefined,
  };

  return pdfMake.createPdf(definition).getBlob();
}

export async function buildCertificateDocx(data: CertificateData): Promise<Blob> {
  const d = await import("docx");
  const { template: t, fields } = data;
  const logo = await pictureBytes(LOGO_URL);
  const sign = data.signature ? { ...(await pictureBytes(data.signature)), ...(await signatureSize(data.signature)) } : null;
  const font = "Arial";
  const text = (value: string, bold = false, size = 24) => new d.TextRun({ text: value, bold, font, size });
  const none = { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const line = { style: d.BorderStyle.SINGLE, size: 6, color: "000000" };
  const cell = (value: string, align: (typeof d.AlignmentType)[keyof typeof d.AlignmentType]) =>
    new d.TableCell({
      width: { size: 3120, type: d.WidthType.DXA },
      borders: { top: line, bottom: line, left: none, right: none },
      children: [new d.Paragraph({ alignment: align, children: [text(value, false, 18)] })],
    });

  const children = [
    new d.Paragraph({
      children: [new d.ImageRun({ type: "png", data: logo.bytes, transformation: { width: 253, height: Math.round(253 * LOGO_RATIO) } }), new d.TextRun({ text: `\t${t.header.form_code}`, bold: true, font, size: 22 })],
      tabStops: [{ type: d.TabStopType.RIGHT, position: 9360 }],
      spacing: { after: 160 },
    }),
    new d.Table({
      width: { size: 9360, type: d.WidthType.DXA },
      columnWidths: [3120, 3120, 3120],
      borders: { top: line, bottom: line, left: none, right: none, insideHorizontal: none, insideVertical: none },
      rows: [new d.TableRow({ children: [cell(`Revision No.: ${t.header.revision_no}`, d.AlignmentType.LEFT), cell(`Issue Date: ${t.header.issue_date}`, d.AlignmentType.CENTER), cell(`Revision Date: ${t.header.revision_date}`, d.AlignmentType.RIGHT)] })],
    }),
    new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 520, after: 360 }, children: [text(t.title, true)] }),
    ...t.paragraphs.map(
      (p) =>
        new d.Paragraph({
          alignment: d.AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { line: 360, lineRule: d.LineRuleType.AUTO, after: 240 },
          children: runsOf(p, fields).map((r) => text(r.text, r.bold)),
        }),
    ),
    new d.Paragraph({ spacing: { before: 360, after: 120 }, children: [text(t.certified_by)] }),
    sign
      ? new d.Paragraph({ children: [new d.ImageRun({ type: sign.type, data: sign.bytes, transformation: { width: Math.round((sign.w * 4) / 3), height: Math.round((sign.h * 4) / 3) } })] })
      : new d.Paragraph({ spacing: { before: 700 }, children: [] }),
    new d.Paragraph({ children: [text(data.editorName.toUpperCase(), true)] }),
    new d.Paragraph({ children: [text(DASHES)] }),
    new d.Paragraph({ children: [text(t.signature_label)] }),
    new d.Paragraph({ spacing: { before: 320 }, children: [text(`${t.date_signed_label}  `), text(fields.signed_date, true)] }),
  ];

  const footer = data.number
    ? new d.Footer({ children: [new d.Paragraph({ alignment: d.AlignmentType.RIGHT, children: [new d.TextRun({ text: `Certificate No. ${data.number}`, font, size: 16, color: "777777" })] })] })
    : undefined;

  const doc = new d.Document({
    creator: "Project Pulse",
    title: `${t.title} ${data.number ?? ""}`.trim(),
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1440, bottom: 1440, left: 1440 } } },
      footers: footer ? { default: footer } : undefined,
      children,
    }],
  });

  return d.Packer.toBlob(doc);
}

export async function downloadCertificate(data: CertificateData, format: "pdf" | "docx", name: string) {
  const blob = format === "pdf" ? await buildCertificatePdf(data) : await buildCertificateDocx(data);
  saveBlob(blob, `${safeFileName(name)}.${format}`);
}
