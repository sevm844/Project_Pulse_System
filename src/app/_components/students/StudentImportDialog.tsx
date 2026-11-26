"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { downloadStudentListTemplate } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";
import {
  confirmStudentImport,
  fetchImportBatches,
  previewStudentImport,
  sendImportInvitations,
  undoStudentImport,
  type ImportBatch,
  type ImportPreview,
  type ImportResult,
} from "../../_lib/studentImport";

// Import the official list of enrolled students (an adviser or the Dean). Choose the file, look at what would happen (nothing is saved yet), then confirm.
// Each new student gets an account and an e-mail with a link to choose their own password; nobody ever sees a password.
export default function StudentImportDialog({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const [step, setStep] = useState<"start" | "preview" | "done">("start");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const open = useRef(true);

  useEffect(() => {
    open.current = true;

    return () => {
      open.current = false;
    };
  }, []);

  const loadBatches = useCallback(() => {
    fetchImportBatches()
      .then(setBatches)
      .catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBatches();
  }, [loadBatches]);

  async function check(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setNote("");

    try {
      setPreview(await previewStudentImport(file));
      setStep("preview");
    } catch (err) {
      setError(errorMessage(err, "The file could not be read."));
    }

    setBusy(false);
    if (input.current) input.current.value = "";
  }

  async function create() {
    if (!preview) return;
    setBusy(true);
    setError("");

    try {
      const created = await confirmStudentImport(preview.token);
      setResult(created);
      setStep("done");
      onChanged?.();
      await sendAll(created.batch_id, created.waiting_for_invitation);
      loadBatches();
      return;
    } catch (err) {
      setError(errorMessage(err, "The accounts could not be created."));
    }

    setBusy(false);
  }

  // Sends the invitations 10 at a time (so one request never takes too long) until none is waiting, showing the count as it goes.
  async function sendAll(batchId: number, waitingAtStart: number) {
    let waiting = waitingAtStart;

    try {
      while (waiting > 0 && open.current) {
        const sent = await sendImportInvitations(batchId);
        waiting = sent.waiting_for_invitation;
        setResult((current) => (current && current.batch_id === batchId ? { ...current, invited: current.invited + sent.invited, waiting_for_invitation: sent.waiting_for_invitation } : current));
        if (sent.invited === 0) break;
      }
    } catch (err) {
      setError(errorMessage(err, "Sending the invitations stopped. You can continue below."));
    }

    setBusy(false);
  }

  async function sendRest(batchId: number) {
    setBusy(true);
    setError("");
    setNote("");

    try {
      const sent = await sendImportInvitations(batchId);
      setNote(`${sent.invited} invitation${sent.invited === 1 ? "" : "s"} sent${sent.failed ? `, ${sent.failed} could not be sent` : ""}.`);
      setResult((current) => (current && current.batch_id === batchId ? { ...current, invited: current.invited + sent.invited, waiting_for_invitation: sent.waiting_for_invitation } : current));
      loadBatches();
    } catch (err) {
      setError(errorMessage(err, "The invitations could not be sent."));
    }

    setBusy(false);
  }

  async function undo(batch: ImportBatch) {
    if (!window.confirm(`Undo the import "${batch.file_name}"? The accounts nobody has used yet are removed. Accounts already used stay.`)) return;
    setBusy(true);
    setError("");

    try {
      const undone = await undoStudentImport(batch.batch_id);
      setNote(`${undone.removed} unused account${undone.removed === 1 ? "" : "s"} removed${undone.kept ? `, ${undone.kept} kept because they were already used` : ""}.`);
      if (result?.batch_id === batch.batch_id) setStep("start");
      loadBatches();
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err, "The import could not be undone."));
    }

    setBusy(false);
  }

  const secondary = "rounded-lg border border-[#cfe0d3] bg-white px-4 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4] disabled:opacity-60";
  const primary = "rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60";
  const label: Record<string, string> = { create: "New account", update: "Fill in details", skip: "Skipped", fail: "Fix this row" };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f2a24]/55 p-3 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Import the student list" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(31,42,36,0.28)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e3f6ec] bg-[#e3f6ec] px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-[#123f2b]">Import the student list</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#cfe0d3] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {note && (
            <p role="status" className="mb-4 rounded-lg bg-[#f3f8f4] px-4 py-3 text-sm font-semibold text-[#2f6b3c]">
              {note}
            </p>
          )}

          {step === "start" && (
            <div>
              <p className="text-sm leading-6 text-[#59645d]">
                Upload your official list of enrolled students (an Excel file or a CSV). The system needs four columns: <span className="font-semibold text-[#203028]">Student Number</span>,{" "}
                <span className="font-semibold text-[#203028]">Full Name (Last Name, First Name)</span>, <span className="font-semibold text-[#203028]">Course</span> and{" "}
                <span className="font-semibold text-[#203028]">Section</span>. Other columns, like the Timestamp, are ignored.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#59645d]">
                <li>Each student&apos;s account name is built from the student number: <span className="font-semibold text-[#203028]">2100961@ub.edu.ph</span>.</li>
                <li>Each new student gets an e-mail with a link to choose their own password. Nobody, including you, ever sees a password.</li>
                <li>A student who already has an account is never changed: only empty details (student number, course, section) are filled in.</li>
                <li>You see what would happen first. Nothing is saved until you confirm.</li>
              </ul>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <input ref={input} type="file" accept=".xlsx,.csv,text/csv" className="hidden" onChange={(event) => void check(event.target.files?.[0])} />
                <button type="button" disabled={busy} onClick={() => input.current?.click()} className={primary}>
                  {busy ? "Reading the file..." : "Choose the file"}
                </button>
                <button type="button" onClick={() => void downloadStudentListTemplate().catch((err) => setError(errorMessage(err, "The template could not be downloaded.")))} className="text-xs font-semibold text-[#2f6b3c] underline">
                  Download the template
                </button>
              </div>

              {batches.length > 0 && (
                <div className="mt-7">
                  <h3 className="text-sm font-semibold text-[#203028]">Earlier imports</h3>
                  <ul className="mt-2 divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec]">
                    {batches.slice(0, 5).map((batch) => (
                      <li key={batch.batch_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#203028]">{batch.file_name}</p>
                          <p className="text-[11px] text-[#7b877f]">
                            {formatDateTime(batch.created_at)} · {batch.imported_by} · {batch.created} created, {batch.updated} filled in
                            {batch.undone ? " · undone" : batch.waiting_for_invitation > 0 ? ` · ${batch.waiting_for_invitation} invitations still to send` : ""}
                          </p>
                        </div>
                        {!batch.undone && (
                          <div className="flex shrink-0 gap-2">
                            {batch.waiting_for_invitation > 0 && (
                              <button type="button" disabled={busy} onClick={() => void sendRest(batch.batch_id)} className={secondary}>
                                Send invitations
                              </button>
                            )}
                            {batch.created > 0 && (
                              <button type="button" disabled={busy} onClick={() => void undo(batch)} className={secondary}>
                                Undo
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === "preview" && preview && (
            <div>
              <p className="text-sm font-semibold text-[#203028]">{preview.file_name}</p>
              <ul className="mt-2 space-y-1 text-sm text-[#59645d]">
                <li><span className="font-semibold text-[#203028]">{preview.total}</span> students read from the file.</li>
                <li><span className="font-semibold text-[#2f6b3c]">{preview.will_create}</span> will get a new account and an invitation e-mail.</li>
                {preview.will_update > 0 && <li><span className="font-semibold text-[#203028]">{preview.will_update}</span> already have an account: only their empty details will be filled in.</li>}
                {preview.will_skip > 0 && <li><span className="font-semibold text-[#203028]">{preview.will_skip}</span> already have an account and are left as they are.</li>}
                {preview.will_fail > 0 && <li><span className="font-semibold text-[#b42318]">{preview.will_fail}</span> cannot be imported: see below.</li>}
              </ul>
              {preview.ignored_columns.length > 0 && <p className="mt-2 text-[11px] text-[#7b877f]">Columns not used: {preview.ignored_columns.join(", ")}.</p>}

              {preview.problems.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-[#203028]">Rows that need your attention</h3>
                  <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#edf2ec]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-[#f7faf7] text-[#7b877f]">
                        <tr>
                          <th className="px-3 py-2 font-medium">Row</th>
                          <th className="px-3 py-2 font-medium">Student</th>
                          <th className="px-3 py-2 font-medium">What happens</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2ec]">
                        {preview.problems.map((row) => (
                          <tr key={`${row.row}-${row.number}`} className="align-top">
                            <td className="px-3 py-2 text-[#7b877f]">{row.row}</td>
                            <td className="px-3 py-2">
                              <span className="block font-semibold text-[#203028]">{row.name || "(no name)"}</span>
                              <span className="text-[#7b877f]">{row.number}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`font-semibold ${row.status === "fail" ? "text-[#b42318]" : "text-[#2f6b3c]"}`}>{label[row.status]}</span>
                              {row.reason && <span className="block text-[#59645d]">{row.reason}</span>}
                              {row.warnings.map((warning) => (
                                <span key={warning} className="block text-[#7b877f]">{warning}</span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.sample.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-[#203028]">A few of the new accounts</h3>
                  <ul className="mt-2 space-y-1 text-xs text-[#59645d]">
                    {preview.sample.map((row) => (
                      <li key={row.number}>
                        <span className="font-semibold text-[#203028]">{row.name}</span> · {row.email} · {row.course ?? "-"} · section {row.section ?? "not set"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.will_fail > 0 && <p className="mt-4 text-xs leading-5 text-[#59645d]">Rows that need fixing are not imported. Fix them in your sheet and upload it again later: students already imported are skipped automatically.</p>}
            </div>
          )}

          {step === "done" && result && (
            <div>
              <p className="text-base font-semibold text-[#1d6b34]">The import is done.</p>
              <ul className="mt-3 space-y-1 text-sm text-[#59645d]">
                <li><span className="font-semibold text-[#203028]">{result.created}</span> new accounts created.</li>
                {result.updated > 0 && <li><span className="font-semibold text-[#203028]">{result.updated}</span> existing students had their empty details filled in.</li>}
                {result.skipped > 0 && <li>{result.skipped} skipped (they already have an account).</li>}
                {result.failed > 0 && <li>{result.failed} {result.failed === 1 ? "row was" : "rows were"} not imported because of a problem.</li>}
                <li>
                  Invitation e-mails sent: <span className="font-semibold text-[#203028]">{result.invited}</span> of {result.created}.
                </li>
              </ul>
              {result.waiting_for_invitation > 0 && (
                <div className="mt-4 rounded-xl border border-[#cfe0d3] bg-[#f3f8f4] p-4">
                  <p className="text-sm text-[#203028]">
                    {busy ? "Sending the invitation e-mails: " : ""}<span className="font-semibold">{result.waiting_for_invitation}</span> student{result.waiting_for_invitation === 1 ? "" : "s"} {busy ? "to go. Keep this window open until it finishes." : "still need their invitation."}
                  </p>
                  <button type="button" disabled={busy} onClick={() => { setBusy(true); void sendAll(result.batch_id, result.waiting_for_invitation); }} className={`${primary} mt-3`}>
                    {busy ? "Sending..." : "Continue sending the invitations"}
                  </button>
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-[#7b877f]">
                If a student does not receive the e-mail, they can press &quot;Forgot Password?&quot; on the login page and use their UB e-mail. The students now appear in Create Group, ready to be added to a group.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#edf2ec] px-6 py-4">
          {step === "preview" && preview ? (
            <>
              <button type="button" disabled={busy} onClick={() => setStep("start")} className={secondary}>
                Choose another file
              </button>
              <button type="button" disabled={busy || !preview.can_import} onClick={() => void create()} className={primary}>
                {busy ? "Creating..." : `Create ${preview.will_create} account${preview.will_create === 1 ? "" : "s"} and send the invitations`}
              </button>
            </>
          ) : step === "done" ? (
            <>
              <button type="button" disabled={busy} onClick={() => setStep("start")} className={secondary}>
                Import another file
              </button>
              <button type="button" onClick={onClose} className={primary}>
                Done
              </button>
            </>
          ) : (
            <span className="text-[11px] text-[#7b877f]">Supported file types: Excel (.xlsx) or CSV, up to 2 MB and 1500 students.</span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
