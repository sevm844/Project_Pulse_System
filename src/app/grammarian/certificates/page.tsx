"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import GrammarianShell from "../_components/GrammarianShell";
import CertificateList from "../../_components/certificates/CertificateList";
import { deleteSignature, fetchCertificateQueue, fetchSignature, saveSignature, signatureDataUrl, type CertificateQueue } from "../../_lib/certificates";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";

// The Grammarian's certificates: groups ready for one, the ones already issued, and the signature printed on them.
export default function GrammarianCertificatesPage() {
  const [queue, setQueue] = useState<CertificateQueue | null>(null);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCertificateQueue()
      .then((q) => !cancelled && setQueue(q))
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to load the certificates.")));
    fetchSignature()
      .then((s) => !cancelled && setSignature(s))
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <GrammarianShell title="Certificates">
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Certification of Editing/Originality</h2>
          <p className="mt-1 text-sm text-[#59645d]">
            When you approve a group&apos;s manuscript, you can issue its certificate here. The form is the university&apos;s own (F-RPO-09): the wording is fixed, and you fill in the
            group&apos;s title, authors, degree and dates. The Dean keeps the wording up to date.
          </p>
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
            <section aria-label="Ready for a certificate">
              <h3 className="mb-3 text-base font-semibold text-[#203028]">Ready for a certificate ({queue.ready.length})</h3>
              {queue.ready.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#cfd9d1] bg-white p-6 text-center text-sm text-[#7b877f]">
                  No group is waiting. A group appears here after you approve its manuscript in the Review Queue.
                </p>
              ) : (
                <ul className="space-y-3">
                  {queue.ready.map((row) => (
                    <li key={row.project_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe8df] bg-white p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#203028]">{row.group_name}</p>
                        <p className="text-xs text-[#59645d]">
                          {row.course} {row.section} &middot; Adviser: {row.adviser ?? "Not assigned"}
                        </p>
                        {row.project_title && <p className="mt-0.5 break-words text-[11px] text-[#7b877f]">{row.project_title}</p>}
                      </div>
                      <Link href={`/grammarian/certificates/${row.project_id}`} className="rounded-full bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">
                        Prepare certificate
                      </Link>
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
                    <li key={row.project_id} className="rounded-2xl border border-[#dfe8df] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#203028]">
                            {row.group_name} <span className="font-normal text-[#59645d]">&middot; {row.certificate_no}</span>
                          </p>
                          <p className="text-xs text-[#59645d]">Issued {formatDateTime(row.issued_at)}</p>
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
          </>
        )}
      </div>
    </GrammarianShell>
  );
}
