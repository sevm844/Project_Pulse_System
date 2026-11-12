"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { errorMessage } from "../../_lib/groups";
import { fetchProjectCertificates, type Certificate } from "../../_lib/certificates";
import { formatDateTime } from "../../_lib/requirements";
import CertificatePaper from "./CertificatePaper";

// Download a certificate as PDF or Word. The writers (and the PDF library) are loaded only when someone downloads.
export async function downloadCertificateFile(certificate: Certificate, format: "pdf" | "docx") {
  const { downloadCertificate } = await import("../../_lib/manuscriptExport/certificate");

  await downloadCertificate(
    { template: certificate.template, fields: certificate.fields, number: certificate.certificate_no, editorName: certificate.editor_name, signature: certificate.editor_signature },
    format,
    `${certificate.certificate_no} ${certificate.group_name}`,
  );
}

// The Certification of Editing/Originality issued to a group: open it, or download it as PDF or Word. Shown to the group,
// its adviser and the Dean; nothing is shown until the Grammarian has issued one.
export default function CertificateList({ projectId, emptyText }: { projectId: number; emptyText?: string }) {
  const [items, setItems] = useState<Certificate[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Certificate | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProjectCertificates(projectId)
      .then((list) => !cancelled && setItems(list))
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to load the certificate.")));

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function download(certificate: Certificate, format: "pdf" | "docx") {
    setBusy(`${certificate.certificate_id}-${format}`);
    setError("");

    try {
      await downloadCertificateFile(certificate, format);
    } catch (err) {
      setError(errorMessage(err, "The file could not be made. Please try again."));
    }

    setBusy(null);
  }

  if (items === null && !error) return <p className="text-sm text-[#7b877f]">Loading...</p>;

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {items && items.length === 0 && (
        <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">{emptyText ?? "No certificate has been issued yet. The Grammarian issues it after the manuscript passes the grammar check."}</p>
      )}

      <ul className="space-y-3">
        {(items ?? []).map((certificate) => (
          <li key={certificate.certificate_id} className="rounded-xl border border-[#edf2ec] bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#203028]">
                  {certificate.certificate_no}
                  {certificate.superseded && <span className="ml-2 rounded-full bg-[#eef2ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#59645d]">Replaced</span>}
                </p>
                <p className="mt-0.5 text-xs text-[#59645d]">
                  Issued by {certificate.editor_name} &middot; {formatDateTime(certificate.issued_at)}
                </p>
                <p className="mt-0.5 break-words text-[11px] text-[#7b877f]">{certificate.fields.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setOpen(certificate)} className="rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1]">
                  View
                </button>
                {(["pdf", "docx"] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void download(certificate, format)}
                    className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50"
                  >
                    {busy === `${certificate.certificate_id}-${format}` ? "Making..." : format === "pdf" ? "PDF" : "Word"}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-4">
            <div role="dialog" aria-modal="true" aria-label={`Certificate ${open.certificate_no}`} className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-[#edf2ec] px-5 py-3">
                <h3 className="text-base font-semibold text-[#203028]">Certificate {open.certificate_no}</h3>
                <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-[#eef2ee] p-3 sm:p-5">
                <CertificatePaper template={open.template} fields={open.fields} editorName={open.editor_name} signature={open.editor_signature} number={open.certificate_no} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
