"use client";

import type { JSONContent } from "@tiptap/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { COURSE_NAMES, errorMessage, fetchMyGroup, type ApiGroup } from "../../_lib/groups";
import { exportManuscript, safeFileName, type ExportFormat, type PageLayout, type TitlePage } from "../../_lib/manuscriptExport";

const DEGREES = COURSE_NAMES;

// The title page, filled in from what the system already knows about the group. Everything stays editable.
function defaultTitlePage(group: ApiGroup | null): TitlePage {
  const degree = group ? DEGREES[group.course] : undefined;
  const members = [...(group?.members ?? [])].sort((a, b) => Number(/leader/i.test(b.role_in_group)) - Number(/leader/i.test(a.role_in_group)));
  const term = [group?.semester, group?.school_year ? `A.Y. ${group.school_year}` : ""].filter(Boolean).join(", ");

  return {
    institution: "University of Batangas",
    college: "College of Information and Communications Technology",
    kind: "A Capstone Project",
    title: group?.project?.project_title ?? "",
    statement: `Presented to the Faculty of the College of Information and Communications Technology\nUniversity of Batangas\n\nIn partial fulfillment of the requirements for the course Capstone Project${degree ? `\n${degree}` : ""}`,
    authors: members.map((m) => m.name),
    adviser: group?.adviser?.name ?? "",
    date: term,
  };
}

type Saved = { titlePage: boolean; toc: boolean; pageNumbers: boolean; layout?: PageLayout; fields: TitlePage };

const storageKey = (projectId: number) => `pulse-export-${projectId}`;

// "Download this manuscript": choose what goes in it (title page, table of contents, page numbers) and the file type.
export default function ManuscriptExportDialog({
  projectId,
  group,
  loadMyGroup = false,
  startPlain = false,
  label,
  getContent,
  onClose,
}: {
  projectId: number;
  group?: ApiGroup | null;
  // Students have no group object here; it is fetched for the title page.
  loadMyGroup?: boolean;
  // Start with no title page, contents or page numbers: just the manuscript (for checking it elsewhere).
  startPlain?: boolean;
  label: string; // "Draft" or "Version 2": part of the file name
  getContent: () => Promise<JSONContent> | JSONContent;
  onClose: () => void;
}) {
  const [titlePage, setTitlePage] = useState(!startPlain);
  const [toc, setToc] = useState(!startPlain);
  const [pageNumbers, setPageNumbers] = useState(!startPlain);
  // A plain copy (to check elsewhere) keeps the editor's own pages; the finished document uses the thesis layout.
  const [layout, setLayout] = useState<PageLayout>(startPlain ? "editor" : "thesis");
  const [fields, setFields] = useState<TitlePage>(() => defaultTitlePage(group ?? null));
  const [ready, setReady] = useState(!loadMyGroup || Boolean(group));
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState("");

  // What the group already typed last time wins over the defaults; a student's own group fills the rest.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let base = defaultTitlePage(group ?? null);
      if (loadMyGroup && !group) {
        try {
          base = defaultTitlePage(await fetchMyGroup());
        } catch {
          // the title page can still be typed by hand
        }
      }

      try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey(projectId)) ?? "null") as Saved | null;
        if (saved?.fields && !cancelled && !startPlain) {
          setTitlePage(saved.titlePage !== false);
          setToc(saved.toc !== false);
          setPageNumbers(saved.pageNumbers !== false);
          setLayout(saved.layout === "editor" ? "editor" : "thesis");
          base = { ...base, ...saved.fields, authors: Array.isArray(saved.fields.authors) ? saved.fields.authors : base.authors };
        }
      } catch {
        // nothing remembered
      }

      if (!cancelled) {
        setFields(base);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, group, loadMyGroup, startPlain]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const set = (key: keyof TitlePage, value: string) => setFields((f) => ({ ...f, [key]: key === "authors" ? value.split("\n") : value }));

  async function download(format: ExportFormat) {
    setBusy(format);
    setError("");

    try {
      if (!startPlain) {
        try {
          window.localStorage.setItem(storageKey(projectId), JSON.stringify({ titlePage, toc, pageNumbers, layout, fields } satisfies Saved));
        } catch {
          // remembering is a convenience only
        }
      }

      const page = { ...fields, authors: fields.authors.map((a) => a.trim()).filter(Boolean) };
      await exportManuscript(await getContent(), format, {
        titlePage: titlePage ? page : null,
        toc,
        pageNumbers,
        layout,
        fileName: safeFileName(`${fields.title.trim() || group?.group_name || "Manuscript"} - ${label}`),
      });
    } catch (err) {
      setError(errorMessage(err, "The file could not be made. Please try again."));
    }

    setBusy(null);
  }

  const input = "mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 py-1.5 text-sm text-[#203028]";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]";

  // Plain download (the Grammarian checking a manuscript elsewhere): the paper as it was submitted, nothing to fill in.
  if (startPlain) {
    return createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-3 sm:p-4">
        <div role="dialog" aria-modal="true" aria-label="Download manuscript" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-[#edf2ec] bg-[#f3f8f4] px-5 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]">Manuscript for checking</p>
              <h3 className="mt-0.5 break-words text-base font-semibold text-[#203028]">{label}</h3>
            </div>
            <button type="button" onClick={onClose} disabled={busy !== null} aria-label="Close" className="shrink-0 rounded-full border border-[#dfe8df] bg-white px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-50">
              Close
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            <p className="text-sm text-[#59645d]">Choose the file type. The paper is saved as it was submitted, ready to check in your own tools.</p>
            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={busy !== null} onClick={() => void download("docx")} className="rounded-xl border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-3 text-sm font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50">
                {busy === "docx" ? "Making the Word file..." : "Download Word"}
              </button>
              <button type="button" disabled={busy !== null} onClick={() => void download("pdf")} className="rounded-xl bg-[#123f2b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                {busy === "pdf" ? "Making the PDF..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Download manuscript" className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ec] px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-[#203028]">Download manuscript</h3>
            <p className="mt-0.5 text-xs text-[#59645d]">{label} as a PDF or a Word file, Letter size. Choose the page layout below.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy !== null} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-50">
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4">
          {!ready && <p className="text-sm text-[#7b877f]">Loading the group details...</p>}

          {ready && (
            <>
              <fieldset className="space-y-2">
                <legend className={labelCls}>Include</legend>
                {[
                  ["Title page", titlePage, setTitlePage],
                  ["Table of contents (from your chapter and section headings)", toc, setToc],
                  ["Page numbers (the title page has none)", pageNumbers, setPageNumbers],
                ].map(([text, value, setter]) => (
                  <label key={text as string} className="flex cursor-pointer items-center gap-2 text-sm text-[#203028]">
                    <input type="checkbox" checked={value as boolean} onChange={(event) => (setter as (v: boolean) => void)(event.target.checked)} className="h-4 w-4 accent-[#123f2b]" />
                    {text as string}
                  </label>
                ))}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className={labelCls}>Page layout</legend>
                {(
                  [
                    ["thesis", "Thesis layout", "1.5 inch left margin for binding and 1 inch elsewhere, each chapter starts on a new page, the contents pages are numbered i, ii and the body starts again at 1."],
                    ["editor", "Like the editor", "1 inch margins all round and one running page number: the same pages you see while writing."],
                  ] as const
                ).map(([value, name, text]) => (
                  <label key={value} className="flex cursor-pointer items-start gap-2 text-sm text-[#203028]">
                    <input type="radio" name="export-layout" checked={layout === value} onChange={() => setLayout(value)} className="mt-1 h-4 w-4 accent-[#123f2b]" />
                    <span>
                      <span className="font-semibold">{name}</span>
                      <span className="block text-xs text-[#7b877f]">{text}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              {titlePage && (
                <fieldset className="space-y-3 rounded-xl border border-[#e5ebe5] bg-[#f8faf7] p-4">
                  <legend className="px-1 text-xs font-semibold text-[#203028]">Title page</legend>
                  <label className={labelCls}>
                    Title of the project
                    <input value={fields.title} onChange={(event) => set("title", event.target.value)} className={input} placeholder="Your approved title" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={labelCls}>
                      School
                      <input value={fields.institution} onChange={(event) => set("institution", event.target.value)} className={input} />
                    </label>
                    <label className={labelCls}>
                      College
                      <input value={fields.college} onChange={(event) => set("college", event.target.value)} className={input} />
                    </label>
                  </div>
                  <label className={labelCls}>
                    Kind of paper
                    <input value={fields.kind} onChange={(event) => set("kind", event.target.value)} className={input} />
                  </label>
                  <label className={labelCls}>
                    Statement
                    <textarea value={fields.statement} onChange={(event) => set("statement", event.target.value)} rows={5} className={input} />
                  </label>
                  <label className={labelCls}>
                    Submitted by (one name per line)
                    <textarea value={fields.authors.join("\n")} onChange={(event) => set("authors", event.target.value)} rows={3} className={input} />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={labelCls}>
                      Adviser
                      <input value={fields.adviser} onChange={(event) => set("adviser", event.target.value)} className={input} />
                    </label>
                    <label className={labelCls}>
                      Date line
                      <input value={fields.date} onChange={(event) => set("date", event.target.value)} className={input} placeholder="1st Semester, A.Y. 2026-2027" />
                    </label>
                  </div>
                </fieldset>
              )}

              <p className="rounded-lg bg-[#f3f8f4] px-3 py-2 text-xs text-[#59645d]">
                The PDF uses look-alike fonts for Calibri, Cambria, Georgia and Verdana. The Word file keeps the fonts you chose. When Word opens the file it asks to
                update fields: choose <span className="font-semibold">Yes</span> so the table of contents fills in.
              </p>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#edf2ec] px-5 py-3">
          <button
            type="button"
            disabled={!ready || busy !== null}
            onClick={() => void download("docx")}
            className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-5 py-2 text-sm font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50"
          >
            {busy === "docx" ? "Making the Word file..." : "Download Word (.docx)"}
          </button>
          <button
            type="button"
            disabled={!ready || busy !== null}
            onClick={() => void download("pdf")}
            className="rounded-full bg-[#123f2b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
          >
            {busy === "pdf" ? "Making the PDF..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
