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

// The header and the foot of the sheet are printed light grey, like a watermark-style letterhead.
const FADE_GREY = "808080";

// The logo at half strength (drawn on white), so it matches the grey form code and revision line in every file type.
async function fadedLogo(): Promise<string> {
  const bitmap = await createImageBitmap(await (await fetch(LOGO_URL)).blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("The logo could not be prepared.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return canvas.toDataURL("image/png");
}

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
  const logo = await fadedLogo();
  const sign = data.signature ? await signatureSize(data.signature) : null;

  const content: unknown[] = [
    { columns: [{ text: t.header.form_code, bold: true, fontSize: 11, color: `#${FADE_GREY}`, width: "*" }, { image: logo, width: 190 }], margin: [0, 0, 0, 40] },
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
    // The revision line sits at the foot of the sheet, without lines.
    footer: {
      margin: [72, 8, 72, 0],
      fontSize: 9,
      color: `#${FADE_GREY}`,
      stack: [
        {
          columns: [
            { text: `Revision No.: ${t.header.revision_no}`, alignment: "left" },
            { text: `Issue Date: ${t.header.issue_date}`, alignment: "center" },
            { text: `Revision Date: ${t.header.revision_date}`, alignment: "right" },
          ],
        },
      ],
    },
  };

  return pdfMake.createPdf(definition).getBlob();
}

export async function buildCertificateDocx(data: CertificateData): Promise<Blob> {
  const d = await import("docx");
  const { template: t, fields } = data;
  const logo = await pictureBytes(await fadedLogo());
  const sign = data.signature ? { ...(await pictureBytes(data.signature)), ...(await signatureSize(data.signature)) } : null;
  const font = "Arial";
  const text = (value: string, bold = false, size = 24, color?: string) => new d.TextRun({ text: value, bold, font, size, color });

  const children = [
    new d.Paragraph({
      children: [new d.TextRun({ text: `${t.header.form_code}\t`, bold: true, font, size: 22, color: FADE_GREY }), new d.ImageRun({ type: "png", data: logo.bytes, transformation: { width: 253, height: Math.round(253 * LOGO_RATIO) } })],
      tabStops: [{ type: d.TabStopType.RIGHT, position: 9360 }],
      spacing: { after: 160 },
    }),
    new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 800, after: 360 }, children: [text(t.title, true)] }),
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

  // The revision line sits at the foot of the sheet, without lines: left, centre and right on one line.
  const footer = new d.Footer({
    children: [
      new d.Paragraph({
        tabStops: [{ type: d.TabStopType.CENTER, position: 4680 }, { type: d.TabStopType.RIGHT, position: 9360 }],
        children: [text(`Revision No.: ${t.header.revision_no}\tIssue Date: ${t.header.issue_date}\tRevision Date: ${t.header.revision_date}`, false, 18, FADE_GREY)],
      }),
    ],
  });

  const doc = new d.Document({
    creator: "Project Pulse",
    title: `${t.title} ${data.number ?? ""}`.trim(),
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1440, bottom: 1440, left: 1440 } } },
      footers: { default: footer },
      children,
    }],
  });

  return d.Packer.toBlob(doc);
}

export async function downloadCertificate(data: CertificateData, format: "pdf" | "docx", name: string) {
  const blob = format === "pdf" ? await buildCertificatePdf(data) : await buildCertificateDocx(data);
  saveBlob(blob, `${safeFileName(name)}.${format}`);
}
