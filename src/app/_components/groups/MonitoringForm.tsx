"use client";

import { useCallback, useEffect, useState } from "react";
import { approveMonitoringRow, fetchMonitoringForm, saveMilestones, signMonitoringRow, type MonitoringFormData, type MonitoringRow } from "../../_lib/advisers";
import { errorMessage } from "../../_lib/groups";
import { formatDate, formatDateTime } from "../../_lib/requirements";

const STATE_TEXT: Record<MonitoringRow["state"], [string, string]> = {
  not_scheduled: ["Not scheduled yet", "text-[#7b877f]"],
  pending: ["Waiting for the defense", "text-amber-700"],
  passed: ["Passed", "text-[#1f7a4a]"],
  failed: ["Failed", "text-[#b42318]"],
};

const buttonClass = "rounded-lg border border-[#123f2b] px-3 py-1.5 text-xs font-semibold text-[#123f2b] transition hover:bg-[#edf9e9] disabled:opacity-60";
const solidClass = "rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f3324] disabled:opacity-60";

// The Capstone Monitoring Form, laid out like the school's paper form: the cover (team, members, title) and the table with a row for each of the Alpha, Beta and Omega
// defenses. The students write the milestones, the Capstone or Technical adviser approves a row (at least a day before the defense), and the Dean's signature is the only
// thing that makes a defense Passed; no adviser approval, or no signature, is a failed defense.
export default function MonitoringForm({ projectId, role }: { projectId: number; role: "Student" | "Adviser" | "Dean" }) {
  const [form, setForm] = useState<MonitoringFormData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<{ type: string; passed: boolean } | null>(null);

  const load = useCallback(() => {
    fetchMonitoringForm(projectId)
      .then((loaded) => {
        setForm(loaded);
        setError("");
      })
      .catch((err) => setError(errorMessage(err, "Could not load the Capstone Monitoring Form.")));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(key: string, action: () => Promise<MonitoringFormData>) {
    setBusy(key);
    setError("");

    try {
      setForm(await action());
      setDrafts((current) => {
        const next = { ...current };
        delete next[key.split(":")[1] ?? ""];

        return next;
      });
    } catch (err) {
      setError(errorMessage(err, "That did not work."));
    } finally {
      setBusy("");
      setConfirming(null);
    }
  }

  async function download(format: "pdf" | "docx") {
    if (!form) return;
    setBusy(`export:${format}`);
    setError("");

    try {
      const { downloadMonitoringForm } = await import("../../_lib/manuscriptExport/monitoringForm");
      await downloadMonitoringForm(form, format);
    } catch (err) {
      setError(errorMessage(err, "Could not make the file."));
    } finally {
      setBusy("");
    }
  }

  if (!form) {
    return error ? <p role="alert" className="text-xs font-semibold text-[#b42318]">{error}</p> : <p className="text-sm text-[#7b877f]">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-[#7b877f]">
          {role === "Student"
            ? "Write the milestones you will show at each defense, from your Gantt chart. Your Capstone or Technical adviser approves each row at least a day before the defense; the Dean signs it after."
            : role === "Adviser"
              ? "Approve a row at least a day before its defense. Either the Capstone or the Technical adviser may approve it."
              : "The Dean's signature on a row is what makes that defense Passed. A row with no adviser approval fails by itself."}
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={busy !== ""} onClick={() => void download("pdf")} className={buttonClass}>{busy === "export:pdf" ? "Making..." : "Download PDF"}</button>
          <button type="button" disabled={busy !== ""} onClick={() => void download("docx")} className={buttonClass}>{busy === "export:docx" ? "Making..." : "Download Word"}</button>
        </div>
      </div>

      {error && <p role="alert" className="text-xs font-semibold text-[#b42318]">{error}</p>}

      <section className="rounded-xl border border-[#dfe8df] bg-white p-4 text-sm text-[#203028]">
        <p><span className="font-semibold">Team name: </span>{form.team_name}</p>
        <p className="mt-3 font-semibold">Team members <span className="font-normal text-[#7b877f]">(leader first, with e-mail address)</span></p>
        <ul className="mt-1 space-y-0.5">
          {form.members.map((m) => (
            <li key={m.email}>{m.name} <span className="text-[#7b877f]">· {m.email}</span></li>
          ))}
        </ul>
        <p className="mt-3"><span className="font-semibold">Title of capstone project: </span>{form.project_title ?? <span className="text-[#7b877f]">not chosen yet</span>}</p>
      </section>

      <section className="rounded-xl border border-[#dfe8df] bg-white p-4">
        <h4 className="text-center text-sm font-bold uppercase text-[#203028]">Monitoring of Capstone Project Milestones</h4>
        <p className="text-center text-sm font-bold text-[#203028]">AY {form.academic_year}</p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs text-[#203028]">
            <thead>
              <tr className="bg-[#f3f8f4]">
                {["Defense", "Milestone to be completed", "Adviser's signature", "Date signed", "Dean's signature", "Date signed"].map((h, i) => (
                  <th key={`${h}${i}`} className="border border-[#cfd9d1] px-2 py-2 text-center font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.rows.map((row) => {
                const [stateText, stateColor] = STATE_TEXT[row.state];
                const key = `milestones:${row.defense_type}`;
                const draft = drafts[row.defense_type];
                const editable = role === "Student" && row.students_may_edit;

                return (
                  <tr key={row.defense_type} className="align-top">
                    <td className="w-36 border border-[#cfd9d1] px-2 py-3 text-center">
                      <p className="font-bold uppercase">{row.defense_type} Defense</p>
                      <p className="mt-1">{row.defense_date ? formatDate(row.defense_date) : "Date of defense: not set yet"}</p>
                      {row.defense_time && <p className="text-[#7b877f]">{row.defense_time}</p>}
                      {row.together_with_omega && <p className="mt-0.5 text-[11px] text-[#7b877f]">Evaluated together with the Omega Defense</p>}
                      <p className={`mt-2 font-semibold ${stateColor}`}>{stateText}</p>
                    </td>

                    <td className="border border-[#cfd9d1] px-2 py-2">
                      {editable ? (
                        <>
                          <textarea
                            value={draft ?? row.milestones ?? ""}
                            onChange={(event) => setDrafts((current) => ({ ...current, [row.defense_type]: event.target.value }))}
                            rows={5}
                            maxLength={4000}
                            aria-label={`Milestones for the ${row.defense_type} defense`}
                            placeholder="List the milestones / deliverables for this stage, as in your Gantt chart."
                            className="w-full rounded-lg border border-[#cfd9d1] px-2 py-1.5 text-xs outline-none focus:border-[#4ac214]"
                          />
                          <button
                            type="button"
                            disabled={busy !== "" || draft === undefined}
                            onClick={() => void run(key, () => saveMilestones(row.defense_type, draft ?? ""))}
                            className={`${buttonClass} mt-1.5`}
                          >
                            {busy === key ? "Saving..." : "Save"}
                          </button>
                        </>
                      ) : row.milestones ? (
                        <p className="whitespace-pre-wrap">{row.milestones}</p>
                      ) : (
                        <p className="text-[#7b877f]">{role === "Student" ? "Locked." : "Nothing written yet."}</p>
                      )}
                    </td>

                    <td className="w-40 border border-[#cfd9d1] px-2 py-3 text-center">
                      {row.adviser_signature ? (
                        <>
                          <p className="font-semibold">{row.adviser_signature.name}</p>
                          <p className="text-[#7b877f]">{row.adviser_signature.role}</p>
                        </>
                      ) : role === "Adviser" && row.adviser_may_approve ? (
                        <button type="button" disabled={busy !== ""} onClick={() => void run(`approve:${row.defense_type}`, () => approveMonitoringRow(projectId, row.defense_type))} className={solidClass}>
                          {busy === `approve:${row.defense_type}` ? "Approving..." : "Approve"}
                        </button>
                      ) : (
                        <p className="text-[#7b877f]">
                          {row.state === "not_scheduled" ? "After the Dean schedules it" : row.adviser_deadline && row.state === "pending" ? `Not approved yet. Approve by ${formatDate(row.adviser_deadline)}` : "Not approved"}
                        </p>
                      )}
                    </td>
                    <td className="w-28 border border-[#cfd9d1] px-2 py-3 text-center">{row.adviser_signature ? formatDateTime(row.adviser_signature.signed_at) : ""}</td>

                    <td className="w-44 border border-[#cfd9d1] px-2 py-3 text-center">
                      {row.dean_signature ? (
                        <p className="font-semibold">{row.dean_signature.name}</p>
                      ) : role === "Dean" && row.dean_may_decide ? (
                        confirming?.type === row.defense_type ? (
                          <div className="space-y-1.5">
                            <p className="font-semibold">{confirming.passed ? "Sign: Passed?" : "No signature: Failed?"}</p>
                            <div className="flex justify-center gap-1.5">
                              <button type="button" disabled={busy !== ""} onClick={() => void run(`dean:${row.defense_type}`, () => signMonitoringRow(projectId, row.defense_type, confirming.passed))} className={solidClass}>
                                {busy === `dean:${row.defense_type}` ? "Saving..." : "Yes"}
                              </button>
                              <button type="button" onClick={() => setConfirming(null)} className={buttonClass}>No</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <button type="button" onClick={() => setConfirming({ type: row.defense_type, passed: true })} className={solidClass}>Sign (Passed)</button>
                            <button type="button" onClick={() => setConfirming({ type: row.defense_type, passed: false })} className={buttonClass}>No signature (Failed)</button>
                          </div>
                        )
                      ) : row.dean_na ? (
                        <p className="text-[#7b877f]">Not applicable: no adviser approval</p>
                      ) : row.state === "failed" ? (
                        <p className="text-[#b42318]">Not signed</p>
                      ) : (
                        <p className="text-[#7b877f]">{row.adviser_signature ? "After the defense" : ""}</p>
                      )}
                    </td>
                    <td className="w-28 border border-[#cfd9d1] px-2 py-3 text-center">{row.dean_signature ? formatDateTime(row.dean_signature.signed_at) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1 text-xs font-bold text-[#203028]">
          {form.rules.map((rule) => (
            <p key={rule}>* {rule}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
