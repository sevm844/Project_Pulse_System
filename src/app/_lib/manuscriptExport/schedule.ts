import { saveBlob, safeFileName } from "./index";
import { loadPdfMake } from "./pdf";

// A defense schedule as a PDF to print or post: landscape Letter, one table, sorted by day and time.

export type ScheduleLine = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  end: string;
  group: string;
  course: string;
  type: string;
  venue: string;
  panel: string;
};

const pretty = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" });

const clock = (time: string) => {
  const [h, m] = time.split(":").map(Number);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export async function downloadSchedulePdf(lines: ScheduleLine[], title: string, subtitle: string, fileName: string) {
  const pdfMake = await loadPdfMake();
  const sorted = [...lines].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.group.localeCompare(b.group));
  const head = ["#", "Date", "Time", "Group", "Defense", "Venue", "Panel"].map((text) => ({ text, bold: true, fillColor: "#eef3ee", fontSize: 9 }));

  const body = sorted.map((line, index) => [
    { text: String(index + 1), fontSize: 9 },
    { text: pretty(line.date), fontSize: 9 },
    { text: `${clock(line.time)} - ${clock(line.end)}`, fontSize: 9 },
    { text: [{ text: line.group, bold: true }, { text: `\n${line.course}` }], fontSize: 9 },
    { text: line.type, fontSize: 9 },
    { text: line.venue, fontSize: 9 },
    { text: line.panel, fontSize: 9 },
  ]);

  const definition = {
    info: { title, author: "Project Pulse" },
    pageSize: "LETTER",
    pageOrientation: "landscape",
    pageMargins: [40, 48, 40, 48],
    defaultStyle: { font: "Arimo", fontSize: 10 },
    content: [
      { text: title, bold: true, fontSize: 16 },
      { text: subtitle, color: "#59645d", margin: [0, 2, 0, 12] },
      {
        table: { headerRows: 1, widths: [18, 80, 92, 110, 70, 80, "*"], body: [head, ...body] },
        layout: { hLineColor: () => "#dfe8df", vLineColor: () => "#dfe8df", paddingTop: () => 4, paddingBottom: () => 4 },
      },
    ],
    footer: (page: number, pages: number) => ({ text: `Page ${page} of ${pages}`, alignment: "right", margin: [40, 0, 40, 0], fontSize: 8, color: "#808080" }),
  };

  saveBlob(await pdfMake.createPdf(definition).getBlob(), `${safeFileName(fileName)}.pdf`);
}
