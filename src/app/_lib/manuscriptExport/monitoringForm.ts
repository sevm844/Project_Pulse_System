import { saveBlob, safeFileName } from "./index";
import { loadPdfMake } from "./pdf";
import { formatDate, formatDateTime } from "../requirements";
import type { MonitoringFormData, MonitoringRow } from "../advisers";

// The Capstone Monitoring Form as one document to print: the cover page (team name, members with e-mail, title) and then the milestones table,
// as on the school's paper form. Made in the browser with the same pdfmake / docx the manuscript export uses.

const LOGO_URL = "/certificate/ub-rpo-logo.png";
const LOGO_RATIO = 1231 / 2671;
const HEADINGS = ["DEFENSE", "MILESTONE TO BE COMPLETED", "Adviser's Signature", "Date Signed", "Dean's Signature", "Date Signed"];

const label = (row: MonitoringRow) => `${row.defense_type.toUpperCase()} Defense`;
const dateOf = (row: MonitoringRow) => (row.defense_date ? formatDate(row.defense_date) : "");
const adviserText = (row: MonitoringRow) => (row.adviser_signature ? `${row.adviser_signature.name ?? ""}\n(${row.adviser_signature.role ?? "Adviser"})` : "");
const adviserDate = (row: MonitoringRow) => (row.adviser_signature ? formatDateTime(row.adviser_signature.signed_at) : "");
const deanText = (row: MonitoringRow) => (row.dean_signature ? row.dean_signature.name ?? "" : row.dean_na ? "Not applicable" : row.state === "failed" ? "Not signed (Failed)" : "");
const deanDate = (row: MonitoringRow) => (row.dean_signature ? formatDateTime(row.dean_signature.signed_at) : "");

// One member per line, "Surname, First M., e-mail": the e-mail goes in the second column, the name in the first.
function parseMembers(text: string | null): { name: string; email: string }[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const email = line.match(/[^\s,;]+@[^\s,;]+/)?.[0] ?? "";

      return { name: line.replace(email, "").replace(/[\s,;()-]+$/, "").trim(), email };
    });
}

async function dataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("A picture for the form could not be read."));
    reader.readAsDataURL(blob);
  });
}

export async function buildMonitoringFormPdf(form: MonitoringFormData): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  const logo = await dataUrl(LOGO_URL);
  const header = { image: logo, width: 190, height: Math.round(190 * LOGO_RATIO), alignment: "right", margin: [0, 0, 0, 14] };
  const cell = (text: string, extra: object = {}) => ({ text, fontSize: 9.5, margin: [3, 3, 3, 3], ...extra });

  const body: unknown[][] = [HEADINGS.map((h) => cell(h, { bold: true, alignment: "center" }))];
  for (const row of form.rows) {
    body.push([
      cell(`${label(row)}\n${dateOf(row) ? `\n${dateOf(row)}${row.together_with_omega ? "\n(with the Omega Defense)" : ""}` : "\n(Date of Defense)"}`, { alignment: "center" }),
      cell(row.milestones ?? "", { margin: [4, 4, 4, 40] }),
      cell(adviserText(row), { alignment: "center" }),
      cell(adviserDate(row), { alignment: "center" }),
      cell(deanText(row), { alignment: "center" }),
      cell(deanDate(row), { alignment: "center" }),
    ]);
  }

  const definition = {
    info: { title: `Capstone Monitoring Form ${form.team_name ?? ""}`, author: "Project Pulse" },
    pageSize: "LETTER",
    pageOrientation: "landscape",
    pageMargins: [54, 40, 54, 40],
    defaultStyle: { font: "Arimo", fontSize: 11 },
    content: [
      // Page 1: the cover.
      header,
      // As on the school's cover: the team name in capitals, the members with their e-mail in a second column, the title in capitals under its heading.
      { text: "TEAM NAME:", bold: true, margin: [0, 24, 0, 10] },
      { text: (form.team_name ?? "").toUpperCase(), margin: [0, 0, 0, 28] },
      { text: "TEAM MEMBERS:", bold: true },
      {
        table: { widths: [300, "*"], body: parseMembers(form.members).map((m) => [{ text: m.name }, { text: m.email }]) },
        layout: "noBorders",
        margin: [1, 0, 0, 0],
      },
      { text: "TITLE OF CAPSTONE PROJECT:", bold: true, margin: [0, 26, 0, 10] },
      { text: (form.project_title ?? "").toUpperCase() },
      // Page 2: the milestones table.
      { text: "", pageBreak: "after" },
      header,
      { text: "MONITORING OF CAPSTONE PROJECT MILESTONES", bold: true, alignment: "center", fontSize: 11 },
      { text: `AY ${form.academic_year}`, bold: true, alignment: "center", fontSize: 11, margin: [0, 0, 0, 12] },
      {
        table: { headerRows: 1, widths: [90, "*", 100, 76, 100, 76], body },
        layout: { hLineWidth: () => 0.7, vLineWidth: () => 0.7, hLineColor: () => "#222", vLineColor: () => "#222" },
      },
      ...form.rules.map((rule, i) => ({ text: `* ${rule}`, bold: true, margin: [0, i === 0 ? 16 : 4, 0, 0] })),
    ],
  };

  return pdfMake.createPdf(definition).getBlob();
}

export async function buildMonitoringFormDocx(form: MonitoringFormData): Promise<Blob> {
  const d = await import("docx");
  const bytes = new Uint8Array(await (await fetch(LOGO_URL)).arrayBuffer());
  const font = "Arial";
  const run = (text: string, bold = false, size = 22) => new d.TextRun({ text, bold, font, size });
  const para = (children: InstanceType<typeof d.TextRun>[], spacing: { before?: number; after?: number } = {}) => new d.Paragraph({ children, spacing });
  const logo = () => new d.Paragraph({ alignment: d.AlignmentType.RIGHT, spacing: { after: 240 }, children: [new d.ImageRun({ type: "png", data: bytes, transformation: { width: 190, height: Math.round(190 * LOGO_RATIO) } })] });
  const lines = (text: string) => text.split("\n").map((line) => new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [run(line, false, 19)] }));
  const cell = (children: InstanceType<typeof d.Paragraph>[], width: number) =>
    new d.TableCell({ width: { size: width, type: d.WidthType.DXA }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children });

  const none = { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const widths = [1700, 3400, 2000, 1500, 2000, 1500];
  const head = new d.TableRow({
    tableHeader: true,
    children: HEADINGS.map((h, i) => cell([new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [run(h, true, 19)] })], widths[i])),
  });
  const rows = form.rows.map(
    (row) =>
      new d.TableRow({
        height: { value: 1700, rule: d.HeightRule.ATLEAST },
        children: [
          cell([new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [run(label(row), true, 19)] }), ...lines(dateOf(row) ? `${dateOf(row)}${row.together_with_omega ? "\n(with the Omega Defense)" : ""}` : "(Date of Defense)")], widths[0]),
          cell((row.milestones ?? "").split("\n").map((line) => new d.Paragraph({ children: [run(line, false, 19)] })), widths[1]),
          cell(lines(adviserText(row)), widths[2]),
          cell(lines(adviserDate(row)), widths[3]),
          cell(lines(deanText(row)), widths[4]),
          cell(lines(deanDate(row)), widths[5]),
        ],
      }),
  );

  const page = { size: { width: 12240, height: 15840, orientation: d.PageOrientation.LANDSCAPE }, margin: { top: 800, right: 1080, bottom: 800, left: 1080 } };
  const doc = new d.Document({
    creator: "Project Pulse",
    title: `Capstone Monitoring Form ${form.team_name ?? ""}`,
    sections: [
      {
        properties: { page },
        children: [
          logo(),
          para([run("TEAM NAME:", true)], { before: 400, after: 160 }),
          para([run((form.team_name ?? "").toUpperCase())], { after: 400 }),
          para([run("TEAM MEMBERS:", true)]),
          new d.Table({
            width: { size: 9000, type: d.WidthType.DXA },
            columnWidths: [5400, 3600],
            borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
            rows: parseMembers(form.members).map((m) => new d.TableRow({ children: [cell([para([run(m.name)])], 5400), cell([para([run(m.email)])], 3600)] })),
          }),
          para([run("TITLE OF CAPSTONE PROJECT:", true)], { before: 480, after: 160 }),
          para([run((form.project_title ?? "").toUpperCase())]),
        ],
      },
      {
        properties: { page },
        children: [
          logo(),
          new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [run("MONITORING OF CAPSTONE PROJECT MILESTONES", true)] }),
          new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: 240 }, children: [run(`AY ${form.academic_year}`, true)] }),
          new d.Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: d.WidthType.DXA }, columnWidths: widths, rows: [head, ...rows] }),
          ...form.rules.map((rule, i) => para([run(`* ${rule}`, true)], { before: i === 0 ? 300 : 80 })),
        ],
      },
    ],
  });

  return d.Packer.toBlob(doc);
}

export async function downloadMonitoringForm(form: MonitoringFormData, format: "pdf" | "docx") {
  const blob = format === "pdf" ? await buildMonitoringFormPdf(form) : await buildMonitoringFormDocx(form);
  saveBlob(blob, `${safeFileName(`Capstone Monitoring Form ${form.team_name ?? ""}`)}.${format}`);
}
