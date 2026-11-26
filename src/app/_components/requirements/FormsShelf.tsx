"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { apiFetch, downloadSharedForm, previewSharedForm } from "../../_lib/api";
import { createGroupDocument } from "../../_lib/groupDocuments";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";
import DashboardCard from "../DashboardCard";
import DocxPreview from "../documents/DocxPreview";

type SharedForm = {
  form_id: number;
  title: string;
  note: string | null;
  file_name: string;
  file_size: number;
  from_role: string;
  uploaded_by_name: string;
  created_at: string;
  can_delete: boolean;
};

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const SHOWN_AS: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", docx: DOCX_MIME };
const extOf = (name: string) => (name.split(".").pop() ?? "").toLowerCase();

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function sizeText(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// The shelf of forms on the Requirements page: the Dean and advisers put a file up once, students download it.
export default function FormsShelf({ role, from }: { role: "Student" | "Adviser" | "Dean" | "Panelist" | "Grammarian" | "Secretary"; from?: "Adviser" | "Dean" }) {
  const [forms, setForms] = useState<SharedForm[] | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const canAdd = role === "Adviser" || role === "Dean";
  const router = useRouter();
  const [viewing, setViewing] = useState<{ form: SharedForm; url: string } | null>(null);
  const [opening, setOpening] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      // From a subject card, only that teacher's forms (AppDev = the adviser's, CAP101-2 = the Dean's).
      const all = await apiFetch<SharedForm[]>("/forms");
      setForms(from ? all.filter((form) => form.from_role === from) : all);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the forms."));
    }
  }, [from]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!file) return;

    setBusy(true);
    setError("");

    try {
      const body = new FormData();
      body.append("title", title.trim());
      if (note.trim()) body.append("note", note.trim());
      body.append("file", file);
      await apiFetch("/forms", { method: "POST", body });
      setAdding(false);
      setTitle("");
      setNote("");
      setFile(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to put up the form."));
    }

    setBusy(false);
  }

  async function remove(form: SharedForm) {
    if (!window.confirm(`Remove "${form.title}"? Students will no longer find it here.`)) return;

    try {
      await apiFetch(`/forms/${form.form_id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to remove the form."));
    }
  }

  // The temporary address of the open form is released when it closes.
  useEffect(() => {
    const url = viewing?.url;

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [viewing]);

  async function view(form: SharedForm) {
    setError("");
    setOpening(form.form_id);

    try {
      setViewing({ form, url: await previewSharedForm(form.form_id, SHOWN_AS[extOf(form.file_name)] ?? "application/octet-stream") });
    } catch (err) {
      setError(errorMessage(err, "Unable to open the form."));
    }

    setOpening(null);
  }

  // A student's copy of a Word form: a new document of the group (in Manuscript) with the form's text in it. The form on the shelf stays as it is.
  async function edit(form: SharedForm) {
    setError("");
    setOpening(form.form_id);

    try {
      const created = await createGroupDocument(form.title);
      router.push(`/student/manuscript/${created.document_id}?fromForm=${form.form_id}`);
    } catch (err) {
      setError(errorMessage(err, "Unable to open the form for editing."));
      setOpening(null);
    }
  }

  async function download(form: SharedForm) {
    try {
      await downloadSharedForm(form.form_id, form.file_name);
    } catch (err) {
      setError(errorMessage(err, "Unable to download the form."));
    }
  }

  return (
    <DashboardCard className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-sm leading-6 text-[#7b877f]">
          {role !== "Adviser" && role !== "Dean"
            ? role === "Student" ? "Forms from the Dean and your adviser. View a form, or press Edit to fill in your own copy in your Manuscript." : "Forms from the Dean. Press View to read a form."
            : role === "Dean"
              ? "Forms for everyone in the system, such as the milestone monitoring form. They stay here for every new batch of teams. Advisers can put up their own forms for their students."
              : "Forms for your students, such as the letter for interview. The Dean's forms show here too."}
        </p>
        {canAdd && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            Upload a form
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={save} className="mt-5 space-y-4 rounded-xl border border-[#dfe8df] bg-[#f8faf7] p-5">
          <label className="block text-xs font-semibold text-[#203028]">
            Name of the form
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              maxLength={150}
              placeholder="Letter for interview"
              className="mt-1 w-full rounded-lg border border-[#dfe3eb] px-3 py-2 text-sm font-normal text-[#203028]"
            />
          </label>
          <label className="block text-xs font-semibold text-[#203028]">
            Note for the students (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Print two copies and bring them to the Dean's office."
              className="mt-1 w-full rounded-lg border border-[#dfe3eb] px-3 py-2 text-sm font-normal text-[#203028]"
            />
          </label>
          <div className="text-xs font-semibold text-[#203028]">
            File. Supported file types: PDF, Word, Excel, PowerPoint, picture or ZIP, up to 10 MB. Students can fill in a Word (.docx) form on screen; other types they can only read.
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#123f2b] bg-white px-4 py-2.5 text-xs font-semibold text-[#123f2b] hover:bg-[#f4f6f3] focus-within:ring-2 focus-within:ring-[#123f2b]/30">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                </svg>
                {file ? "Choose another file" : "Choose a file"}
                <input
                  type="file"
                  accept={ACCEPT}
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              <span className="min-w-0 truncate text-sm font-normal text-[#4d5751]">{file ? file.name : "No file chosen yet"}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy || !file}
              className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
            >
              {busy ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-lg border border-[#dfe3eb] px-4 py-2.5 text-xs font-semibold text-[#203028] hover:bg-[#f4f6f3]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-5 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {forms === null && !error && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

      {forms !== null && forms.length === 0 && (
        <p className="mt-10 text-center text-sm text-[#9aa59e]">
          {canAdd ? "No forms yet. Press Upload a form to put one up." : "No forms have been put up yet."}
        </p>
      )}

      {forms !== null && forms.length > 0 && (
        <ul className="mt-6 divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec]">
          {forms.map((form) => (
            <li key={form.form_id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 sm:flex-1">
                <p className="truncate text-sm font-semibold text-[#203028]">{form.title}</p>
                {form.note && <p className="mt-0.5 text-xs text-[#4d5751]">{form.note}</p>}
                <p className="mt-0.5 truncate text-xs text-[#7b877f]" title={form.file_name}>
                  From {form.from_role === "Dean" ? "the Dean" : form.uploaded_by_name} · {formatDate(form.created_at)} · {form.file_name} · {sizeText(form.file_size)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 sm:justify-end">
                {SHOWN_AS[extOf(form.file_name)] ? (
                  <button type="button" disabled={opening === form.form_id} onClick={() => void view(form)} aria-label={`View ${form.title}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0d3] bg-white px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4] disabled:opacity-50">
                    <EyeIcon />
                    View
                  </button>
                ) : (
                  <button type="button" onClick={() => void download(form)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0d3] bg-white px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4] disabled:opacity-50">
                    Download
                  </button>
                )}
                {role === "Student" && extOf(form.file_name) === "docx" && (
                  <button type="button" disabled={opening === form.form_id} onClick={() => void edit(form)} aria-label={`Edit ${form.title} in your Manuscript`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0d3] bg-white px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4] disabled:opacity-50">
                    <PencilIcon />
                    Edit
                  </button>
                )}
                {form.can_delete && (
                  <button
                    type="button"
                    onClick={() => void remove(form)}
                    className="rounded-lg border border-[#dfe3eb] px-3 py-2 text-xs font-semibold text-[#b42318] hover:bg-[#fdf3f2]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {viewing &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f2a24]/60 p-3 sm:p-6">
            <div role="dialog" aria-modal="true" aria-label="Form" className="flex h-full max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(31,42,36,0.3)]">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#edf2ec] px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#203028]">{viewing.form.title}</p>
                  <p className="truncate text-[11px] text-[#9aa59e]">{viewing.form.file_name}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {role === "Student" && extOf(viewing.form.file_name) === "docx" && (
                    <button
                      type="button"
                      onClick={() => {
                        const chosen = viewing.form;
                        setViewing(null);
                        void edit(chosen);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
                    >
                      <PencilIcon />
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewing(null)}
                    autoFocus
                    className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 bg-[#f3f7f1]">
                {extOf(viewing.form.file_name) === "pdf" ? (
                  <iframe src={viewing.url} title={viewing.form.title} className="h-full w-full" />
                ) : extOf(viewing.form.file_name) === "docx" ? (
                  <DocxPreview url={viewing.url} name={viewing.form.file_name} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewing.url} alt={viewing.form.title} className="mx-auto h-full max-w-full object-contain" />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </DashboardCard>
  );
}
