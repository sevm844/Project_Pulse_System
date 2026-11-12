"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import GrammarianShell from "../_components/GrammarianShell";
import CertificateList from "../../_components/certificates/CertificateList";
import ManuscriptExportDialog from "../../_components/manuscript/ManuscriptExportDialog";
import {
  deleteSignature,
  fetchCertificateQueue,
  fetchSignature,
  returnNotPassed,
  saveSignature,
  signatureDataUrl,
  type CertificateQueue,
  type DeskRow,
} from "../../_lib/certificates";
import { errorMessage } from "../../_lib/groups";
import { fetchManuscriptVersion } from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

// The Grammarian's desk. The Dean sends a group's final manuscript here; she downloads it, checks it outside the system
// (plagiarism and so on), then comes back to issue the certificate (it goes straight to the Dean) or to return the group
// as not passed. She also keeps the certificate form and her signature here.
export default function GrammarianCertificatesPage() {
  const [queue, setQueue] = useState<CertificateQueue | null>(null);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [downloadFor, setDownloadFor] = useState<DeskRow | null>(null);
  const [returning, setReturning] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [returnError, setReturnError] = useState("");

  const load = useCallback(async () => {
    try {
      setQueue(await fetchCertificateQueue());
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load your desk."));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    fetchSignature()
      .then(setSignature)
      .catch(() => undefined);
  }, [load]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setSignatureError("");

    try {
      if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error("Choose a PNG, JPEG or WebP picture of your signature.");
      setSignature(await saveSignature(await signatureDataUrl(file)));
    } catch (err) {
      setSignatureError(errorMessage(err, "The signature could not be saved."));
    }

    setBusy(false);
  }

  async function removeSignature() {
    setBusy(true);
    setSignatureError("");

    try {
      await deleteSignature();
      setSignature(null);
    } catch (err) {
      setSignatureError(errorMessage(err, "The signature could not be removed."));
    }

    setBusy(false);
  }

  async function sendBack(row: DeskRow) {
    setBusy(true);
    setReturnError("");

    try {
      await returnNotPassed(row.referral_id, remarks);
      setReturning(null);
      setRemarks("");
      await load();
    } catch (err) {
      setReturnError(errorMessage(err, "The group could not be returned."));
    }

    setBusy(false);
  }

  return (
    <GrammarianShell title="Certificates">
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Certification of Editing/Originality</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#59645d]">
            <li>The Dean sends you a group&apos;s final manuscript. It appears under <strong>Waiting for you</strong>.</li>
            <li>Download it and check it outside the system (plagiarism and so on).</li>
            <li>
              Come back: <strong>Prepare certificate</strong> for a group that passes (it goes straight to the Dean), or <strong>Did not pass</strong> to return it to the Dean with your remarks.
            </li>
          </ol>
          <Link href="/grammarian/certificates/form" className="mt-3 inline-block rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-1.5 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
            Edit the certificate form (F-RPO-09)
          </Link>
        </div>

        <section className="rounded-2xl border border-[#dfe8df] bg-white p-5" aria-label="Your signature">
          <h3 className="text-base font-semibold text-[#203028]">Your signature</h3>
          <p className="mt-1 text-xs text-[#59645d]">Printed above your name on every certificate you issue. Use a clear picture of your signature on plain white paper, or a PNG with a see-through background.</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex h-[84px] w-[220px] items-center justify-center rounded-lg border border-dashed border-[#cfd9d1] bg-[#fbfdfb]">
              {signature ? (
                // eslint-disable-next-line @next/next/no-img-element -- the person's own picture (a data URL)
                <img src={signature} alt="Your signature" className="max-h-[76px] max-w-[210px]" />
              ) : (
                <span className="text-xs text-[#9aa79d]">No signature yet</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-full bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">
                {signature ? "Change signature" : "Upload signature"}
                <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => void upload(event)} className="hidden" />
              </label>
              {signature && (
                <button type="button" disabled={busy} onClick={() => void removeSignature()} className="rounded-full border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#d04545] hover:bg-red-50 disabled:opacity-50">
                  Remove
                </button>
              )}
            </div>
          </div>
          {signatureError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {signatureError}
            </p>
          )}
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {!queue && !error && <p className="text-sm text-[#7b877f]">Loading...</p>}

        {queue && (
          <>
            <section aria-label="Waiting for you">
              <h3 className="mb-3 text-base font-semibold text-[#203028]">Waiting for you ({queue.waiting.length})</h3>
              {queue.waiting.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#cfd9d1] bg-white p-6 text-center text-sm text-[#7b877f]">Nothing is waiting. When the Dean sends you a manuscript, it appears here.</p>
              ) : (
                <ul className="space-y-3">
                  {queue.waiting.map((row) => (
                    <li key={row.referral_id} className="rounded-2xl border border-[#dfe8df] bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#203028]">{row.group_name}</p>
                          <p className="text-xs text-[#59645d]">
                            {row.course} {row.section} &middot; Adviser: {row.adviser ?? "Not assigned"}
                          </p>
                          {row.project_title && <p className="mt-0.5 break-words text-[11px] text-[#7b877f]">{row.project_title}</p>}
                          <p className="mt-1 text-xs text-[#59645d]">
                            Final manuscript, version {row.version_no}, sent by {row.sent_by ?? "the Dean"} &middot; {formatDateTime(row.sent_at)}
                          </p>
                          {row.note && <p className="mt-1 break-words text-xs italic text-[#59645d]">&ldquo;{row.note}&rdquo;</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setDownloadFor(row)} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                            Download manuscript
                          </button>
                          <Link href={`/grammarian/certificates/${row.project_id}`} className="rounded-full bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">
                            Prepare certificate
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setReturning(returning === row.referral_id ? null : row.referral_id);
                              setRemarks("");
                              setReturnError("");
                            }}
                            aria-expanded={returning === row.referral_id}
                            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Did not pass
                          </button>
                        </div>
                      </div>

                      {returning === row.referral_id && (
                        <div className="mt-3 rounded-xl border border-red-100 bg-red-50/40 p-3">
                          <label className="block text-xs font-semibold text-[#203028]">
                            What should the Dean know? (for example the similarity result or what must be fixed)
                            <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} maxLength={1000} aria-label="Remarks for the Dean" className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 py-2 text-sm" />
                          </label>
                          {returnError && (
                            <p role="alert" className="mt-2 text-xs text-red-600">
                              {returnError}
                            </p>
                          )}
                          <div className="mt-2 flex justify-end gap-2">
                            <button type="button" onClick={() => setReturning(null)} className="rounded-full border border-[#dfe8df] bg-white px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                              Cancel
                            </button>
                            <button type="button" disabled={busy || remarks.trim().length < 5} onClick={() => void sendBack(row)} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                              {busy ? "Returning..." : "Return to the Dean"}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Issued certificates">
              <h3 className="mb-3 text-base font-semibold text-[#203028]">Issued ({queue.issued.length})</h3>
              {queue.issued.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#cfd9d1] bg-white p-6 text-center text-sm text-[#7b877f]">Nothing issued yet.</p>
              ) : (
                <ul className="space-y-3">
                  {queue.issued.map((row) => (
                    <li key={row.referral_id} className="rounded-2xl border border-[#dfe8df] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#203028]">
                            {row.group_name} <span className="font-normal text-[#59645d]">&middot; {row.certificate_no}</span>
                          </p>
                          <p className="text-xs text-[#59645d]">Sent to the Dean {formatDateTime(row.issued_at)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setOpenId(openId === row.project_id ? null : row.project_id)} aria-expanded={openId === row.project_id} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-1.5 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                            {openId === row.project_id ? "Hide" : "Open / download"}
                          </button>
                          <Link href={`/grammarian/certificates/${row.project_id}`} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                            Issue again
                          </Link>
                        </div>
                      </div>
                      {openId === row.project_id && (
                        <div className="mt-3 border-t border-[#edf2ec] pt-3">
                          <CertificateList projectId={row.project_id} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {queue.returned.length > 0 && (
              <section aria-label="Returned to the Dean">
                <h3 className="mb-3 text-base font-semibold text-[#203028]">Returned to the Dean ({queue.returned.length})</h3>
                <ul className="space-y-3">
                  {queue.returned.map((row) => (
                    <li key={row.referral_id} className="rounded-2xl border border-[#dfe8df] bg-white p-4">
                      <p className="text-sm font-semibold text-[#203028]">
                        {row.group_name} <span className="font-normal text-[#59645d]">&middot; version {row.version_no}</span>
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">Did not pass</span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#59645d]">Returned {formatDateTime(row.decided_at)}</p>
                      {row.remarks && <p className="mt-1 break-words text-xs italic text-[#59645d]">&ldquo;{row.remarks}&rdquo;</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {downloadFor && (
        <ManuscriptExportDialog
          projectId={downloadFor.project_id}
          label={`${downloadFor.group_name} - Version ${downloadFor.version_no}`}
          startPlain
          getContent={async () => (await fetchManuscriptVersion(downloadFor.project_id, downloadFor.version_no)).content}
          onClose={() => setDownloadFor(null)}
        />
      )}
    </GrammarianShell>
  );
}
