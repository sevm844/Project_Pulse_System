import { saveBlob, safeFileName } from "./index";
import { loadPdfMake } from "./pdf";
import { formatDate } from "../requirements";
import { RATING_LEVELS, RUBRIC_MAX, RUBRIC_SECTIONS, rubricTitle, rubricTotal, type Ratings } from "../rubric";

// The Proposal Defense Rubric as a PDF to print and sign: the department's paper form with the logo, the title with the course, the
// group, the criteria table with the panelist's ratings marked, the total, the comments on ruled lines and the signature.

export type RubricPdfData = {
  course: string;
  groupName: string;
  members: string[];
  date: string | null;
  ratings: Ratings;
  comments: string;
  panelistName: string;
  signature: string | null; // a data URL
  signedDate: string | null;
};

const SIGN_H = 40; // room above the signature line, in points
const LOGO_URL = "/certificate/ub-rpo-logo.png";
const LOGO_RATIO = 1231 / 2671;

async function dataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("A picture for the form could not be read."));
    reader.readAsDataURL(blob);
  });
}

async function signatureSize(signature: string): Promise<{ w: number; h: number }> {
  const bitmap = await createImageBitmap(await (await fetch(signature)).blob());
  const scale = Math.min(1, 165 / bitmap.width, SIGN_H / bitmap.height);
  const size = { w: Math.round(bitmap.width * scale), h: Math.round(bitmap.height * scale) };
  bitmap.close();

  return size;
}

export async function buildRubricPdf(data: RubricPdfData): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  const logo = await dataUrl(LOGO_URL);
  const sign = data.signature ? await signatureSize(data.signature) : null;
  const total = rubricTotal(data.ratings);
  const rated = Object.keys(data.ratings).length > 0;

  const cell = (text: string, extra: object = {}) => ({ text, fontSize: 9.5, margin: [2, 2, 2, 2], ...extra });
  const head = [
    cell("Criteria", { bold: true, alignment: "center", margin: [2, 12, 2, 2] }),
    ...RATING_LEVELS.map((l) => cell(`${l.label}\n(${l.value})`, { bold: true, alignment: "center" })),
    cell("Score", { bold: true, alignment: "center", margin: [2, 12, 2, 2] }),
  ];

  const rows: unknown[][] = [head];
  for (const section of RUBRIC_SECTIONS) {
    rows.push([cell(section.title, { bold: true, colSpan: 6 }), {}, {}, {}, {}, {}]);
    for (const c of section.criteria) {
      const value = data.ratings[c.key];
      rows.push([
        cell(c.label),
        ...RATING_LEVELS.map((l) => cell(value === l.value ? "X" : "", { alignment: "center", bold: true, fillColor: value === l.value ? "#e6efe8" : undefined })),
        cell(value ? String(value) : "", { alignment: "center", bold: true }),
      ]);
    }
  }
  rows.push([cell("TOTAL", { bold: true }), cell("", { colSpan: 4 }), {}, {}, {}, cell(rated ? `${total} / ${RUBRIC_MAX}` : "", { alignment: "center", bold: true, fontSize: 8.5 })]);

  // the comments on ruled lines, like the paper
  const commentLines = data.comments.trim() ? data.comments.split("\n") : [];
  const ruled = Array.from({ length: Math.max(7, commentLines.length) }, (_, i) => ({
    text: commentLines[i] ?? " ",
    fontSize: 10,
    margin: [2, 5, 2, 1],
  }));

  const definition = {
    info: { title: `${rubricTitle(data.course)} ${data.groupName}`, author: "Project Pulse" },
    pageSize: "LETTER",
    pageMargins: [54, 40, 54, 48],
    defaultStyle: { font: "Arimo", fontSize: 10 },
    content: [
      { image: logo, width: 190, height: Math.round(190 * LOGO_RATIO), alignment: "right", margin: [0, 0, 0, 10] },
      { text: rubricTitle(data.course), font: "Tinos", bold: true, fontSize: 12.5, alignment: "center", margin: [0, 6, 0, 16] },
      {
        columns: [
          { text: [{ text: "Group Name: " }, { text: data.groupName, bold: true }], width: "*" },
          { text: [{ text: "Date: " }, { text: data.date ? formatDate(data.date) : "", bold: true }], width: "auto" },
        ],
        margin: [8, 0, 0, 2],
      },
      { text: [{ text: "Members: " }, { text: data.members.join("; "), bold: true }], margin: [8, 0, 0, 14] },
      {
        table: { headerRows: 1, widths: ["*", 52, 44, 44, 76, 48], body: rows },
        layout: { hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => "#222", vLineColor: () => "#222" },
      },
      { text: "Comments:", margin: [8, 16, 0, 0] },
      {
        table: { widths: ["*"], body: ruled.map((line) => [line]) },
        layout: { hLineWidth: (i: number) => (i === 0 ? 0 : 0.6), vLineWidth: () => 0, hLineColor: () => "#222" },
        margin: [8, 0, 8, 0],
      },
      // As on the paper form: "Panelist's Signature: ______" and "Date: ______" on one line; the signature picture and the date sit on their lines.
      {
        columns: [
          { text: "Panelist's Signature:", width: "auto", margin: [0, SIGN_H - 11, 6, 0] },
          {
            width: 175,
            stack: [
              sign ? { image: data.signature, width: sign.w, height: sign.h, margin: [4, SIGN_H - sign.h, 0, 0] } : { text: " ", margin: [0, SIGN_H - 10, 0, 0] },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 175, y2: 0, lineWidth: 0.6 }] },
            ],
          },
          { text: "", width: "*" },
          { text: "Date:", width: "auto", margin: [0, SIGN_H - 11, 6, 0] },
          {
            width: 150,
            stack: [
              { text: data.signedDate ? formatDate(data.signedDate) : " ", bold: true, alignment: "center", margin: [0, SIGN_H - 12, 0, 0] },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.6 }] },
            ],
          },
        ],
        margin: [8, 22, 8, 0],
      },
    ],
  };

  return pdfMake.createPdf(definition).getBlob();
}

export async function downloadRubricPdf(data: RubricPdfData) {
  saveBlob(await buildRubricPdf(data), `${safeFileName(`${data.course} Proposal Defense Rubric ${data.groupName} ${data.panelistName}`)}.pdf`);
}
