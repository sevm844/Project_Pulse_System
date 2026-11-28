"use client";

import { useCallback, useEffect, useState } from "react";
import { approveMonitoringRow, fetchMonitoringForm, saveMonitoringForm, signMonitoringRow, type MonitoringFormData, type MonitoringRow } from "../../_lib/advisers";
import { deleteSignature, fetchSignature, saveSignature, signatureDataUrl } from "../../_lib/certificates";
import { errorMessage } from "../../_lib/groups";
import { formatDate, formatDateTime } from "../../_lib/requirements";

const STATE_TEXT: Record<MonitoringRow["state"], [string, string]> = {
  not_scheduled: ["Not scheduled yet", "text-[#7b877f]"],
  pending: ["Waiting for the defense", "text-amber-700"],
  passed: ["Passed", "text-[#1f7a4a]"],
  failed: ["Failed", "text-[#b42318]"],
};

// Real examples shown in the empty boxes (never a description of what to write).
const MILESTONE_EXAMPLES: Record<string, string> = {
  Alpha: ["Chapters 1 to 3 completed", "System design and database design finished", "Login and registration modules working"].join("\n"),
  Beta: ["Chapters 4 and 5 drafted", "All main modules completed", "User testing with 10 respondents done"].join("\n"),
  Omega: ["Final manuscript completed", "System deployed and tested", "User manual and installation guide finished"].join("\n"),
};

const buttonClass = "rounded-lg border border-[#123f2b] px-3 py-1.5 text-xs font-semibold text-[#123f2b] transition hover:bg-[#edf9e9] disabled:opacity-60";
const solidClass = "rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f3324] disabled:opacity-60";

// The Capstone Monitoring Form, laid out like the school's paper form: the cover (team, members, title) and the table with a row for each of the Alpha, Beta and Omega
// defenses. The students write the milestones, the Capstone or Technical adviser approves a row (at least a day before the defense), and the Dean's signature is the only
// thing that makes a defense Passed; no adviser approval, or no signature, is a failed defense.
export default function MonitoringForm({ projectId, role }: { projectId: number; role: "Student" | "Adviser" | "Dean" }) {
  const [form, setForm] = useState<MonitoringFormData | null>(null);
  // The adviser's (or Dean's) own signature picture: approving puts it on the row, with the date and time added by the system.
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureLoaded, setSignatureLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  // What the students typed and have not saved yet: the cover fields and the milestones of each defense.
  const [cover, setCover] = useState({ team_name: "", members: "", project_title: "" });
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

  useEffect(() => {
    if (role === "Student") return;
    fetchSignature()
      .then(setSignature)
      .catch(() => {})
      .finally(() => setSignatureLoaded(true));
  }, [role]);

  async function uploadSignature(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");

    try {
      if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error("Choose a PNG, JPEG or WebP picture of your signature.");
      setSignature(await saveSignature(await signatureDataUrl(file)));
    } catch (err) {
      setError(errorMessage(err, "The signature could not be saved."));
    }
  }

  async function removeSignature() {
    try {
      await deleteSignature();
      setSignature(null);
    } catch (err) {
      setError(errorMessage(err, "The signature could not be removed."));
    }
  }

  async function run(key: string, action: () => Promise<MonitoringFormData>) {
    setBusy(key);
    setError("");

    try {
      setForm(await action());
      if (key === "save") {
        setDrafts({});
        setCover({ team_name: "", members: "", project_title: "" });
      }
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

  const typed = Object.values(drafts).some((text) => text.trim()) || Object.values(cover).some((text) => text.trim());

  if (!form) {
    return error ? <p role="alert" className="text-xs font-semibold text-[#b42318]">{error}</p> : <p className="text-sm text-[#7b877f]">Loading...</p>;
  }

  // A cover place the students have already saved is plain text; an empty one is a box to write in (students only). Saved text cannot be changed.
  function coverField(field: "team_name" | "members" | "project_title", saved: string | null, placeholder: string, rows: number) {
    if (saved) return <p className="mt-1 whitespace-pre-wrap">{saved}</p>;
    if (role !== "Student") return <p className="mt-1 text-[#7b877f]">Not written by the students yet.</p>;

    return (
      <textarea
        value={cover[field]}
        onChange={(event) => setCover((current) => ({ ...current, [field]: event.target.value }))}
        rows={rows}
        maxLength={field === "members" ? 2000 : 500}
        aria-label={field}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-[#cfd9d1] px-2 py-1.5 text-sm outline-none focus:border-[#4ac214]"
      />
    );
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

      {role !== "Student" && signatureLoaded && (
        <section className="rounded-xl border border-[#dfe8df] bg-white p-4">
          <h4 className="text-sm font-semibold text-[#203028]">Your signature</h4>
          <p className="mt-1 text-xs leading-5 text-[#7b877f]">
            {role === "Adviser" ? "Upload a picture of your signature once. When you approve a row, this picture is placed on it, with the date and time added by the system. " : "Upload a picture of your signature once. When you sign a row, it is placed on it with the date and time. "}
            Supported file types: PNG, JPEG or WebP picture.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {signature && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signature} alt="Your signature" className="h-12 max-w-[10rem] rounded border border-[#edf2ec] bg-white object-contain p-1" />
            )}
            <label className="cursor-pointer rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
              {signature ? "Change signature" : "Upload signature"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadSignature(event)} className="hidden" />
            </label>
            {signature && (
              <button type="button" onClick={() => void removeSignature()} className="text-xs font-semibold text-[#b42318] hover:underline">
                Remove
              </button>
            )}
            {!signature && <span className="text-xs text-amber-700">Upload your signature before you {role === "Adviser" ? "approve" : "sign"} a row.</span>}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[#dfe8df] bg-white p-4 text-sm text-[#203028]">
        <p className="font-semibold">Team name</p>
        {coverField("team_name", form.team_name, "Team Alon", 1)}
        <p className="mt-3 font-semibold">Team members <span className="font-normal text-[#7b877f]">(leader first, then the members: name and e-mail address, one per line)</span></p>
        {coverField("members", form.members, "Santos, Maria Clara L., 2301234@ub.edu.ph\nReyes, Juan Miguel P., 2305678@ub.edu.ph", 4)}
        <p className="mt-3 font-semibold">Title of capstone project</p>
        {coverField("project_title", form.project_title, "Barangay Health Records Management System with Appointment Scheduling", 2)}
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
                            value={draft ?? ""}
                            onChange={(event) => setDrafts((current) => ({ ...current, [row.defense_type]: event.target.value }))}
                            rows={5}
                            maxLength={4000}
                            aria-label={`Milestones for the ${row.defense_type} defense`}
                            placeholder={MILESTONE_EXAMPLES[row.defense_type]}
                            className="w-full rounded-lg border border-[#cfd9d1] px-2 py-1.5 text-center text-xs outline-none focus:border-[#4ac214]"
                          />
                        </>
                      ) : row.milestones ? (
                        <p className="whitespace-pre-wrap text-center">{row.milestones}</p>
                      ) : (
                        <p className="text-[#7b877f]">{role === "Student" ? "Locked." : "Nothing written yet."}</p>
                      )}
                    </td>

                    <td className="w-40 border border-[#cfd9d1] px-2 py-3 text-center">
                      {row.adviser_signature ? (
                        row.adviser_signature.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.adviser_signature.image} alt={`Signature of ${row.adviser_signature.name ?? "the adviser"}`} className="mx-auto h-14 max-w-full object-contain" />
                        ) : (
                          <p className="font-semibold">{row.adviser_signature.name}</p>
                        )
                      ) : role === "Adviser" && row.adviser_may_approve ? (
                        <button type="button" disabled={busy !== "" || !signature} title={signature ? undefined : "Upload your signature first"} onClick={() => void run(`approve:${row.defense_type}`, () => approveMonitoringRow(projectId, row.defense_type))} className={solidClass}>
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
                        row.dean_signature.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.dean_signature.image} alt={`Signature of ${row.dean_signature.name ?? "the Dean"}`} className="mx-auto h-14 max-w-full object-contain" />
                        ) : (
                          <p className="text-[#7b877f]">Signed</p>
                        )
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
                            <button type="button" disabled={!signature} title={signature ? undefined : "Upload your signature first"} onClick={() => setConfirming({ type: row.defense_type, passed: true })} className={solidClass}>Sign (Passed)</button>
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

        {role === "Student" && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <p className="text-[11px] text-[#7b877f]">Once you save, what you wrote cannot be changed.</p>
            <button
              type="button"
              disabled={busy !== "" || !typed}
              onClick={() => {
                if (!window.confirm("Save the Capstone Monitoring Form? What you wrote cannot be changed after this.")) return;
                void run("save", () => saveMonitoringForm({ team_name: cover.team_name, members: cover.members, project_title: cover.project_title, milestones: drafts }));
              }}
              className={solidClass}
            >
              {busy === "save" ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
