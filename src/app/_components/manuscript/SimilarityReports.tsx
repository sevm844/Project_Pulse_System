"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { downloadSimilarityReport, previewSimilarityReport } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import {
  deleteSimilarityReport,
  fetchManuscriptVersions,
  fetchSimilarityReports,
  uploadSimilarityReport,
  type ManuscriptVersion,
  type SimilarityReport,
} from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// The report from the plagiarism check (Turnitin is used outside this system). The Dean uploads the PDF for the group; the students
// and their adviser read it, fix what was flagged in their manuscript, and submit a new version. Newest first.
export default function SimilarityReports({
  projectId,
  canUpload = false,
  reloadKey = 0,
}: {
  projectId: number;
  canUpload?: boolean;
  reloadKey?: number;
}) {
  const [reports, setReports] = useState<SimilarityReport[] | null>(null);
  const [versions, setVersions] = useState<ManuscriptVersion[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [versionNo, setVersionNo] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [list, vs] = await Promise.all([fetchSimilarityReports(projectId), canUpload ? fetchManuscriptVersions(projectId) : Promise.resolve([])]);
      setReports(list);
      setVersions(vs);
    } catch (err) {
      setError(errorMessage(err, "Unable to load the similarity reports."));
    }
  }, [projectId, canUpload]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load, reloadKey]);

  async function open(report: SimilarityReport) {
    setError("");
    // Opened in this click so a pop-up blocker allows it; the address is filled in once the file arrives.
    const tab = window.open("", "_blank");

    try {
      const url = await previewSimilarityReport(report.report_id);
      if (tab) tab.location.href = url;
      else setError("Your browser blocked the new tab. Allow pop-ups for this site, or press Download.");
    } catch (err) {
      tab?.close();
      setError(errorMessage(err, "Unable to open the report."));
    }
  }

  async function save() {
    if (!file || busy) return;
    setBusy(true);
    setError("");

    try {
      await uploadSimilarityReport(projectId, file, versionNo, note);
      setForm(false);
      setFile(null);
      setNote("");
      if (picker.current) picker.current.value = "";
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to upload the report."));
    }

    setBusy(false);
  }

  async function remove(report: SimilarityReport) {
    if (!window.confirm("Remove this report? The group will no longer see it.")) return;

    try {
      await deleteSimilarityReport(report.report_id);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to remove the report."));
    }
  }

  // Students and advisers see nothing until the Dean has uploaded a report.
  if (!canUpload && (!reports || reports.length === 0) && !error) return null;

  return (
    <section aria-label="Similarity reports" className="rounded-xl border border-[#dfe8df] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#203028]">Similarity report</h4>
          <p className="mt-0.5 max-w-xl text-xs leading-5 text-[#7b877f]">
            {canUpload
              ? "Check the latest manuscript in Turnitin, then upload the report (PDF) here. The group can read it."
              : "The Dean checked your manuscript for similarity. Read the report, fix the flagged parts in your manuscript, then submit a new version."}
          </p>
        </div>
        {canUpload && !form && (
          <button type="button" onClick={() => { setForm(true); setVersionNo(versions.length ? versions[versions.length - 1].version_no : null); }} className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">
            Upload report
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-[#b42318]">
          {error}
        </p>
      )}

      {canUpload && form && (
        <div className="mt-4 space-y-3 rounded-lg bg-[#f8faf7] p-4">
          <label className="block text-xs font-semibold text-[#203028]">
            Report file (PDF, up to 20 MB)
            <input
              ref={picker}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs font-normal"
            />
          </label>

          {versions.length > 0 && (
            <label className="block text-xs font-semibold text-[#203028]">
              Which manuscript version did you check?
              <select
                value={versionNo ?? ""}
                onChange={(event) => setVersionNo(event.target.value ? Number(event.target.value) : null)}
                className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs font-normal"
              >
                <option value="">Not stated</option>
                {[...versions].reverse().map((v) => (
                  <option key={v.version_no} value={v.version_no}>
                    Version {v.version_no}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-xs font-semibold text-[#203028]">
            Note for the group (optional)
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder="For example: 18% similarity. Please rewrite the parts highlighted in Chapter 2."
              className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs font-normal"
            />
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={() => void save()} disabled={!file || busy} className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
              {busy ? "Uploading..." : "Send to the group"}
            </button>
            <button type="button" onClick={() => { setForm(false); setFile(null); setError(""); }} className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {reports && reports.length > 0 ? (
        <ul className="mt-4 divide-y divide-[#edf2ec]">
          {reports.map((report) => (
            <li key={report.report_id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-[#203028]">{report.file_name}</p>
                <p className="mt-0.5 text-xs text-[#7b877f]">
                  {report.version_no ? `Version ${report.version_no} · ` : ""}
                  {formatDateTime(report.created_at)}
                  {report.uploaded_by ? ` · ${report.uploaded_by}` : ""} · {size(report.file_size)}
                </p>
                {report.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#59645d]">{report.note}</p>}
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button type="button" onClick={() => void open(report)} className="text-[#2f6b3c] hover:underline">
                  View
                </button>
                <button
                  type="button"
                  onClick={() => void downloadSimilarityReport(report.report_id, report.file_name).catch((err) => setError(errorMessage(err, "Unable to download the report.")))}
                  className="text-[#2f6b3c] hover:underline"
                >
                  Download
                </button>
                {canUpload && (
                  <button type="button" onClick={() => void remove(report)} className="text-[#b42318] hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        reports && <p className="mt-4 text-sm text-[#7b877f]">No report uploaded yet.</p>
      )}
    </section>
  );
}
