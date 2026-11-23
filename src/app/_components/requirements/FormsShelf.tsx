"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch, downloadSharedForm } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";
import DashboardCard from "../DashboardCard";

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

function sizeText(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// The shelf of forms on the Requirements page: the Dean and advisers put a file up once, students download it.
export default function FormsShelf({ role }: { role: "Student" | "Adviser" | "Dean" | "Panelist" | "Grammarian" | "Secretary" }) {
  const [forms, setForms] = useState<SharedForm[] | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const canAdd = role === "Adviser" || role === "Dean";

  const load = useCallback(async () => {
    try {
      setForms(await apiFetch<SharedForm[]>("/forms"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the forms."));
    }
  }, []);

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
            ? role === "Student" ? "Forms from the Dean and your adviser. Download, fill in, print and sign." : "Forms from the Dean. Download them any time."
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
            File (PDF, Word, Excel, PowerPoint, picture or ZIP, up to 10 MB)
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
            <li key={form.form_id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#203028]">{form.title}</p>
                {form.note && <p className="mt-0.5 text-xs text-[#4d5751]">{form.note}</p>}
                <p className="mt-0.5 text-xs text-[#7b877f]">
                  From {form.from_role === "Dean" ? "the Dean" : form.uploaded_by_name} · {formatDate(form.created_at)} · {form.file_name} · {sizeText(form.file_size)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void download(form)}
                  className="rounded-lg border border-[#dfe3eb] px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f4f6f3]"
                >
                  Download
                </button>
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
    </DashboardCard>
  );
}
