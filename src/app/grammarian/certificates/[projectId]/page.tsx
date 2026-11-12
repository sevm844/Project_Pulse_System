"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import GrammarianShell from "../../_components/GrammarianShell";
import CertificatePaper from "../../../_components/certificates/CertificatePaper";
import { downloadCertificateFile } from "../../../_components/certificates/CertificateList";
import {
  doneDateText,
  fetchCertificateDraft,
  fetchSignature,
  issueCertificate,
  parseDateInput,
  signedDateText,
  todayInput,
  type Certificate,
  type CertificateDraft,
  type CertificateFields,
  type FieldName,
} from "../../../_lib/certificates";
import { errorMessage } from "../../../_lib/groups";

// A certificate for one group, written on the form itself: the wording is fixed, and the bold highlighted parts (title,
// authors, degree and the dates) are filled in for the group and can be corrected right on the page.
export default function PrepareCertificatePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);

  const [draft, setDraft] = useState<CertificateDraft | null>(null);
  const [fields, setFields] = useState<CertificateFields | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [useSignature, setUseSignature] = useState(true);
  const [doneDate, setDoneDate] = useState(todayInput());
  const [signedDate, setSignedDate] = useState(todayInput());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<Certificate | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const d = await fetchCertificateDraft(projectId);
        if (cancelled) return;
        setDraft(d);
        setFields(d.fields);
        if (d.has_signature) setSignature(await fetchSignature());
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "This group is not ready for a certificate yet."));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const change = (field: FieldName, value: string) => setFields((f) => (f ? { ...f, [field]: value } : f));

  function pickDate(kind: "done" | "signed", value: string) {
    const date = parseDateInput(value);
    if (kind === "done") setDoneDate(value);
    else setSignedDate(value);
    if (date) change(kind === "done" ? "done_date" : "signed_date", kind === "done" ? doneDateText(date) : signedDateText(date));
  }

  async function issue() {
    if (!fields || busy) return;
    setBusy(true);
    setError("");

    try {
      setIssued(await issueCertificate(projectId, fields, useSignature && Boolean(signature)));
    } catch (err) {
      setError(errorMessage(err, "The certificate could not be issued."));
    }

    setBusy(false);
  }

  async function download(format: "pdf" | "docx") {
    if (!issued) return;
    setDownloading(format);

    try {
      await downloadCertificateFile(issued, format);
    } catch (err) {
      setError(errorMessage(err, "The file could not be made. Please try again."));
    }

    setDownloading(null);
  }

  const incomplete = !fields || Object.values(fields).some((v) => !v.trim());

  return (
    <GrammarianShell title="Certificate">
      <div className="space-y-5">
        <Link href="/grammarian/certificates" className="text-xs font-semibold text-[#59645d] underline">
          &larr; All certificates
        </Link>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {!draft && !error && <p className="text-sm text-[#7b877f]">Opening the form...</p>}

        {issued && (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-base font-semibold text-emerald-900">Certificate {issued.certificate_no} issued</h2>
            <p className="mt-1 text-sm text-emerald-900/80">The certificate for {issued.group_name} was sent to the Dean. Download a copy to print or keep.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={downloading !== null} onClick={() => void download("pdf")} className="rounded-full bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                {downloading === "pdf" ? "Making the PDF..." : "Download PDF"}
              </button>
              <button type="button" disabled={downloading !== null} onClick={() => void download("docx")} className="rounded-full border border-[#cfe0d3] bg-white px-4 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4] disabled:opacity-50">
                {downloading === "docx" ? "Making the Word file..." : "Download Word (.docx)"}
              </button>
              <Link href="/grammarian/certificates" className="rounded-full border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                Back to the list
              </Link>
            </div>
          </div>
        )}

        {draft && fields && !issued && (
          <>
            <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
              <h2 className="text-lg font-semibold text-[#203028]">Certificate for {draft.group_name}</h2>
              <p className="mt-1 text-sm text-[#59645d]">
                Check the form below. <strong>Click any bold, highlighted part</strong> to correct it: the title, the authors, the degree and the dates. The rest of the wording is the
                university&apos;s and is fixed.
              </p>
              {draft.already_issued && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Certificate {draft.already_issued} was already issued to this group. Issuing again gives a new number and replaces it (the old one stays on record, marked as replaced).
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-end gap-4">
                <label className="text-xs font-semibold text-[#203028]">
                  Date of certification
                  <input type="date" value={doneDate} onChange={(event) => pickDate("done", event.target.value)} className="mt-1 block rounded-lg border border-[#dfe8df] px-2.5 py-1.5 text-sm" />
                </label>
                <label className="text-xs font-semibold text-[#203028]">
                  Date signed
                  <input type="date" value={signedDate} onChange={(event) => pickDate("signed", event.target.value)} className="mt-1 block rounded-lg border border-[#dfe8df] px-2.5 py-1.5 text-sm" />
                </label>
                <button type="button" onClick={() => { setFields(draft.fields); setDoneDate(todayInput()); setSignedDate(todayInput()); }} className="rounded-full border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                  Start again
                </button>
                <label className={`flex items-center gap-2 text-xs font-semibold ${signature ? "text-[#203028]" : "text-[#9aa79d]"}`}>
                  <input type="checkbox" checked={useSignature && Boolean(signature)} disabled={!signature} onChange={(event) => setUseSignature(event.target.checked)} className="h-4 w-4 accent-[#123f2b]" />
                  Print my signature
                  {!signature && (
                    <Link href="/grammarian/certificates" className="font-normal underline">
                      (add one first)
                    </Link>
                  )}
                </label>
              </div>
            </div>

            <div className="overflow-auto rounded-2xl bg-[#eef2ee] p-3 sm:p-6">
              <CertificatePaper template={draft.template.content} fields={fields} editable onChange={change} editorName={draft.editor_name} signature={useSignature ? signature : null} />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {incomplete && <p className="text-xs text-red-600">Every bold part must be filled in.</p>}
              <button type="button" disabled={busy || incomplete} onClick={() => void issue()} className="rounded-full bg-[#123f2b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                {busy ? "Issuing..." : "Issue certificate"}
              </button>
            </div>
          </>
        )}
      </div>
    </GrammarianShell>
  );
}
