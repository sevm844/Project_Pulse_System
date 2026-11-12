import { apiFetch } from "./api";

// The Grammarian's "Certification of Editing/Originality" (university form F-RPO-09). The form is fixed wording with
// fill-in fields; only the Dean changes the wording, the Grammarian fills in the fields for each group and issues it.

export type CertificateTemplate = {
  header: { form_code: string; revision_no: string; issue_date: string; revision_date: string };
  title: string;
  paragraphs: string[];
  certified_by: string;
  signature_label: string;
  date_signed_label: string;
};

export type CertificateFields = { title: string; authors: string; degree: string; done_date: string; signed_date: string };
export type FieldName = keyof CertificateFields;

export const FIELD_LABELS: Record<FieldName, string> = {
  title: "Project title",
  authors: "Authors",
  degree: "Degree",
  done_date: "Date of certification",
  signed_date: "Date signed",
};

export type Certificate = {
  certificate_id: number;
  certificate_no: string;
  project_id: number;
  group_name: string;
  template_version: number;
  template: CertificateTemplate;
  fields: CertificateFields;
  editor_name: string;
  editor_signature: string | null;
  issued_at: string;
  superseded: boolean;
};

export type TemplateVersion = { version_no: number; note: string | null; saved_by: string | null; saved_at: string };
export type TemplateResponse = { version_no: number; content: CertificateTemplate; updated_at: string; history?: TemplateVersion[] };

export type CertificateRow = { project_id: number; group_name: string; course: string; section: string; project_title: string | null; adviser: string | null };
export type CertificateQueue = {
  ready: CertificateRow[];
  issued: (CertificateRow & { certificate_id: number; certificate_no: string; issued_at: string })[];
};

export type CertificateDraft = {
  project_id: number;
  group_name: string;
  template: { version_no: number; content: CertificateTemplate };
  fields: CertificateFields;
  editor_name: string;
  has_signature: boolean;
  already_issued: string | null;
};

export const fetchCertificateTemplate = () => apiFetch<TemplateResponse>("/certificate-template");
export const saveCertificateTemplate = (content: CertificateTemplate, note: string) =>
  apiFetch<TemplateResponse>("/certificate-template", { method: "PUT", body: JSON.stringify({ content, note: note.trim() || undefined }) });
export const fetchCertificateQueue = () => apiFetch<CertificateQueue>("/grammarian/certificates");
export const fetchCertificateDraft = (projectId: number) => apiFetch<CertificateDraft>(`/projects/${projectId}/certificate/draft`);
export const issueCertificate = (projectId: number, fields: CertificateFields, useSignature: boolean) =>
  apiFetch<Certificate>(`/projects/${projectId}/certificates`, { method: "POST", body: JSON.stringify({ fields, use_signature: useSignature }) });
export const fetchProjectCertificates = (projectId: number) => apiFetch<Certificate[]>(`/projects/${projectId}/certificates`);

export const fetchSignature = () => apiFetch<{ signature: string | null }>("/me/signature").then((r) => r.signature);
export const saveSignature = (signature: string) =>
  apiFetch<{ signature: string }>("/me/signature", { method: "PUT", body: JSON.stringify({ signature }) }).then((r) => r.signature);
export const deleteSignature = () => apiFetch<{ signature: null }>("/me/signature", { method: "DELETE" });

// One piece of the wording: plain text, or the place where a fill-in field goes.
export type Segment = { text: string; field?: FieldName };

const TOKEN = /\{\{\s*(title|authors|degree|done_date|signed_date)\s*\}\}/g;

export function segments(paragraph: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;

  for (const match of paragraph.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ text: paragraph.slice(last, at) });
    out.push({ text: "", field: match[1] as FieldName });
    last = at + match[0].length;
  }
  if (last < paragraph.length) out.push({ text: paragraph.slice(last) });

  return out;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;

  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
};

// "22nd day of June, 2025": how the form writes the date of certification.
export const doneDateText = (date: Date) => `${ordinal(date.getDate())} day of ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;

// "June 24, 2025": how the form writes the date signed.
export const signedDateText = (date: Date) => `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

// A date input's "2025-06-22" as a local date (never shifted by the time zone).
export const parseDateInput = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

export const todayInput = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// A signature picture, shrunk (keeping any transparency) so it stays small. PNG keeps the see-through background.
export async function signatureDataUrl(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 600 / bitmap.width, 240 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the picture.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/png");
}
