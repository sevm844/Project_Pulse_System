"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GrammarianShell from "../../_components/GrammarianShell";
import CertificatePaper from "../../../_components/certificates/CertificatePaper";
import { fetchCertificateTemplate, saveCertificateTemplate, type CertificateTemplate, type FieldName, type TemplateResponse } from "../../../_lib/certificates";
import { errorMessage } from "../../../_lib/groups";
import { formatDateTime } from "../../../_lib/requirements";

const FIELD_BUTTONS: [FieldName, string][] = [
  ["title", "Project title"],
  ["authors", "Authors"],
  ["degree", "Degree"],
  ["done_date", "Date of certification"],
];

const SAMPLE = {
  title: "\"Sample Project Title\": A System for Everyone",
  authors: "Dela Cruz, Juan, Santos, Maria, and Reyes, Pedro",
  degree: "Bachelor of Science in Information Technology",
  done_date: "22nd day of June, 2025",
  signed_date: "June 24, 2025",
};

// The wording of the Grammarian's own Certification of Editing/Originality (university form F-RPO-09). She saves it,
// as a new version; certificates already issued keep the version they were issued on.
export default function CertificateFormPage() {
  const [saved, setSaved] = useState<TemplateResponse | null>(null);
  const [form, setForm] = useState<CertificateTemplate | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const areas = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCertificateTemplate()
      .then((t) => {
        if (cancelled) return;
        setSaved(t);
        setForm(t.content);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to load the form.")));

    return () => {
      cancelled = true;
    };
  }, []);

  const edit = (patch: Partial<CertificateTemplate>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const editHeader = (key: keyof CertificateTemplate["header"], value: string) => setForm((f) => (f ? { ...f, header: { ...f.header, [key]: value } } : f));
  const editParagraph = (index: number, value: string) => setForm((f) => (f ? { ...f, paragraphs: f.paragraphs.map((p, i) => (i === index ? value : p)) } : f));

  // Put a fill-in field where the cursor is in the paragraph being written.
  function insertField(index: number, field: FieldName) {
    const area = areas.current[index];
    if (!area || !form) return;
    const token = `{{${field}}}`;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    editParagraph(index, area.value.slice(0, start) + token + area.value.slice(end));
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save() {
    if (!form || busy) return;
    setBusy(true);
    setError("");
    setDone("");

    try {
      const t = await saveCertificateTemplate(form, note);
      setSaved(t);
      setForm(t.content);
      setNote("");
      setDone(`Saved as version ${t.version_no}. Certificates issued from now on use it; the ones already issued are not changed.`);
    } catch (err) {
      setError(errorMessage(err, "The form could not be saved."));
    }

    setBusy(false);
  }

  const changed = Boolean(saved && form && JSON.stringify(saved.content) !== JSON.stringify(form));
  const input = "mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 py-1.5 text-sm text-[#203028]";
  const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]";

  return (
    <GrammarianShell title="Certificate Form">
      <div className="space-y-5">
        <Link href="/grammarian/certificates" className="text-xs font-semibold text-[#59645d] underline">
          &larr; All certificates
        </Link>

        <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Certificate of Editing/Originality: the form</h2>
          <p className="mt-1 text-sm text-[#59645d]">
            This is the university&apos;s form (F-RPO-09). Change the wording or the revision details here when the university revises it. The highlighted fields are filled in for each
            group when you issue a certificate. Each save is a new version; certificates already issued keep the version they were issued on.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {done && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {done}
          </p>
        )}
        {!form && !error && <p className="text-sm text-[#7b877f]">Loading the form...</p>}

        {form && saved && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl border border-[#dfe8df] bg-white p-5">
              <p className="text-sm font-semibold text-[#203028]">Editing version {saved.version_no} (saves as version {saved.version_no + 1})</p>

              <fieldset className="grid grid-cols-2 gap-3">
                <legend className={label}>Form header</legend>
                <label className="text-xs font-semibold text-[#203028]">Form code<input value={form.header.form_code} onChange={(e) => editHeader("form_code", e.target.value)} className={input} /></label>
                <label className="text-xs font-semibold text-[#203028]">Revision No.<input value={form.header.revision_no} onChange={(e) => editHeader("revision_no", e.target.value)} className={input} /></label>
                <label className="text-xs font-semibold text-[#203028]">Issue date<input value={form.header.issue_date} onChange={(e) => editHeader("issue_date", e.target.value)} className={input} /></label>
                <label className="text-xs font-semibold text-[#203028]">Revision date<input value={form.header.revision_date} onChange={(e) => editHeader("revision_date", e.target.value)} className={input} /></label>
              </fieldset>

              <label className={label}>Title<input value={form.title} onChange={(e) => edit({ title: e.target.value })} className={input} /></label>

              <div className="space-y-3">
                <p className={label}>Wording (the highlighted fields are filled in for each group)</p>
                {form.paragraphs.map((paragraph, index) => (
                  <div key={index} className="rounded-xl border border-[#edf2ec] bg-[#f8faf7] p-3">
                    <textarea
                      ref={(el) => {
                        areas.current[index] = el;
                      }}
                      value={paragraph}
                      onChange={(e) => editParagraph(index, e.target.value)}
                      rows={index === 0 ? 7 : 2}
                      aria-label={`Paragraph ${index + 1}`}
                      className={input}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-[#7b877f]">Insert field:</span>
                      {FIELD_BUTTONS.map(([field, text]) => (
                        <button key={field} type="button" onClick={() => insertField(index, field)} className="rounded-full border border-[#cfe0d3] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#123f2b] hover:bg-[#f3f8f4]">
                          {text}
                        </button>
                      ))}
                      {form.paragraphs.length > 1 && (
                        <button type="button" onClick={() => edit({ paragraphs: form.paragraphs.filter((_, i) => i !== index) })} className="ml-auto text-[11px] font-semibold text-[#d04545] hover:underline">
                          Remove paragraph
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {form.paragraphs.length < 8 && (
                  <button type="button" onClick={() => edit({ paragraphs: [...form.paragraphs, ""] })} className="rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1]">
                    + Add a paragraph
                  </button>
                )}
              </div>

              <label className={label}>Line before the signature<input value={form.certified_by} onChange={(e) => edit({ certified_by: e.target.value })} className={input} /></label>
              <label className={label}>Label under the signature line<input value={form.signature_label} onChange={(e) => edit({ signature_label: e.target.value })} className={input} /></label>
              <label className={label}>Label for the date signed<input value={form.date_signed_label} onChange={(e) => edit({ date_signed_label: e.target.value })} className={input} /></label>
              <label className={label}>What changed? (optional)<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className={input} placeholder="e.g. Revision 1, 2026" /></label>

              <div className="flex items-center justify-end gap-3">
                {changed && <button type="button" onClick={() => setForm(saved.content)} className="text-xs font-semibold text-[#59645d] underline">Discard changes</button>}
                <button type="button" disabled={busy || !changed} onClick={() => void save()} className="rounded-full bg-[#123f2b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                  {busy ? "Saving..." : "Save as a new version"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-auto rounded-2xl bg-[#eef2ee] p-3 sm:p-5">
                <p className="mb-3 text-center text-xs text-[#7b877f]">Preview with sample details</p>
                <CertificatePaper template={form} fields={SAMPLE} editorName="Sample Grammarian" signature={null} />
              </div>

              <section className="rounded-2xl border border-[#dfe8df] bg-white p-5" aria-label="Versions">
                <h3 className="text-base font-semibold text-[#203028]">Versions</h3>
                <ul className="mt-3 space-y-2">
                  {(saved.history ?? []).map((v) => (
                    <li key={v.version_no} className="text-sm">
                      <span className="font-semibold text-[#203028]">Version {v.version_no}</span>
                      {v.version_no === saved.version_no && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">In use</span>}
                      <span className="ml-2 text-xs text-[#59645d]">
                        {v.saved_by ?? "The system"} &middot; {formatDateTime(v.saved_at)}
                      </span>
                      {v.note && <p className="text-xs italic text-[#7b877f]">&ldquo;{v.note}&rdquo;</p>}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </GrammarianShell>
  );
}
