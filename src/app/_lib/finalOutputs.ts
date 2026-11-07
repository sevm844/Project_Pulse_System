import { apiFetch } from "./api";

export type OutputState =
  | "Missing"
  | "In review"
  | "Needs revision"
  | "Grammar check"
  | "Ready to receive"
  | "Received";

export type ApiFinalOutput = {
  requirement_id: number;
  title: string;
  stage: string;
  state: OutputState;
  submission_id: number | null;
  version_no: number | null;
  file_name: string | null;
  has_file: boolean;
  link_url: string | null;
  submitted_at: string | null;
  received_at: string | null;
};

export type ApiFinalRecord = {
  project_id: number;
  group_name: string;
  course: string;
  section: string;
  school_year: string | null;
  adviser: string | null;
  project_title: string | null;
  outputs: ApiFinalOutput[];
  total: number;
  received: number;
  complete: boolean;
  archived_at: string | null;
  archived_by: string | null;
  archive_remarks: string | null;
};

export const outputDot: Record<OutputState, string> = {
  Missing: "bg-[#dfe5e1]",
  "In review": "bg-amber-400",
  "Needs revision": "bg-rose-500",
  "Grammar check": "bg-amber-400",
  "Ready to receive": "bg-sky-400",
  Received: "bg-emerald-500",
};

export function fetchFinalRecords(archived: boolean) {
  return apiFetch<ApiFinalRecord[]>(`/final-outputs${archived ? "?archived=1" : ""}`);
}

export function matchesSearch(record: ApiFinalRecord, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [record.group_name, record.project_title, record.adviser, record.course, record.section]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

// A cell that starts with = + - or @ would run as a formula in Excel, so it is neutralised.
function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadCsv(fileName: string, rows: (string | number | null)[][]) {
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`﻿${body}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}
