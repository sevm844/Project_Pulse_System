"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DeanShell from "../_components/DeanShell";
import CertificateList from "../../_components/certificates/CertificateList";
import ManuscriptView from "../../_components/manuscript/ManuscriptView";
import { fetchManuscriptVersion } from "../../_lib/manuscript";
import { fetchReferralCandidates, fetchReferrals, sendToGrammarian, type Referral, type ReferralCandidate } from "../../_lib/certificates";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";

// The Dean sends a group's final manuscript to the Grammarian here, and receives the certificate of every group that passes.
// A group that does not pass comes back with the Grammarian's remarks.
export default function DeanCertificatesPage() {
  const [candidates, setCandidates] = useState<ReferralCandidate[] | null>(null);
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [projectId, setProjectId] = useState<number | "">("");
  const [versionNo, setVersionNo] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [reading, setReading] = useState<{ title: string; content: JSONContent | null; error: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([fetchReferralCandidates(), fetchReferrals()]);
      setCandidates(c);
      setReferrals(r);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the certificates."));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const chosen = candidates?.find((c) => c.project_id === projectId);
  // Normally only groups that passed their Final Defense are offered: those are the final manuscripts. The Dean can widen the
  // list for an exception; the chosen group always stays in it.
  const offered = (candidates ?? []).filter((c) => showAll || c.final_defense_passed || c.project_id === projectId);
  const hiddenCount = (candidates ?? []).length - offered.length;

  function choose(id: number | "") {
    setProjectId(id);
    const candidate = candidates?.find((c) => c.project_id === id);
    setVersionNo(candidate?.latest_version_no ?? "");
    if (candidate && !candidate.final_defense_passed) setShowAll(true);
    setDone("");
  }

  async function readManuscript() {
    if (!chosen || versionNo === "") return;
    const title = `${chosen.group_name} - Version ${versionNo}`;
    setReading({ title, content: null, error: "" });

    try {
      setReading({ title, content: (await fetchManuscriptVersion(chosen.project_id, versionNo)).content, error: "" });
    } catch (err) {
      setReading({ title, content: null, error: errorMessage(err, "The manuscript could not be opened.") });
    }
  }

  async function send() {
    if (projectId === "" || versionNo === "" || busy) return;
    setBusy(true);
    setError("");
    setDone("");

    try {
      await sendToGrammarian(projectId, versionNo, note);
      setDone(`${chosen?.group_name ?? "The group"}'s manuscript (version ${versionNo}) was sent to the Grammarian.`);
      setProjectId("");
      setVersionNo("");
      setNote("");
      await load();
    } catch (err) {
      setError(errorMessage(err, "The manuscript could not be sent."));
    }

    setBusy(false);
  }

  const chip = (r: Referral) =>
    r.status === "Sent"
      ? ["Waiting for the Grammarian", "bg-amber-50 text-amber-700"]
      : r.status === "Passed"
        ? ["Passed: certificate received", "bg-emerald-50 text-emerald-700"]
        : ["Did not pass", "bg-red-50 text-red-700"];

  return (
    <DeanShell title="Certificates">
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Grammarian&apos;s certificate of editing/originality</h2>
          <p className="mt-1 text-sm text-[#59645d]">
            Send a group&apos;s final manuscript to the Grammarian when it is ready. She checks it outside the system and comes back with the certificate for every group that passes; it is
            sent straight to you here. A group that does not pass comes back with her remarks.
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

        <section className="rounded-2xl border border-[#dfe8df] bg-white p-5" aria-label="Send a manuscript">
          <h3 className="text-base font-semibold text-[#203028]">Send a manuscript to the Grammarian</h3>
          <p className="mt-1 text-xs text-[#7b877f]">Groups that passed their Final Defense and have a submitted manuscript are listed here.</p>
          {candidates && candidates.length === 0 ? (
            <p className="mt-2 text-sm text-[#7b877f]">No group can be sent right now: a group needs a submitted manuscript version, and a group already with the Grammarian has to be answered first.</p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="text-xs font-semibold text-[#203028]">
                Group
                <select value={projectId} onChange={(event) => choose(event.target.value ? Number(event.target.value) : "")} aria-label="Group" className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 py-2 text-sm">
                  <option value="">Choose a group...</option>
                  {offered.map((c) => (
                    <option key={c.project_id} value={c.project_id}>
                      {c.group_name} ({c.course} {c.section}){c.final_defense_passed ? "" : ` - not yet through the Final Defense (${c.current_phase})`}
                      {c.status === "Not Passed" ? " - returned before" : c.status === "Passed" ? " - certificate received" : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-normal text-[#59645d]">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} className="h-4 w-4 accent-[#123f2b]" />
                    Show other groups too (an exception)
                  </label>
                  {!showAll && hiddenCount > 0 && <span className="text-[#7b877f]">{hiddenCount} more with a manuscript, not yet through the Final Defense.</span>}
                </span>
              </label>
              <label className="text-xs font-semibold text-[#203028]">
                Manuscript version
                <select value={versionNo} disabled={!chosen} onChange={(event) => setVersionNo(Number(event.target.value))} aria-label="Manuscript version" className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 py-2 text-sm disabled:opacity-50">
                  {chosen &&
                    Array.from({ length: chosen.latest_version_no ?? 0 }, (_, i) => (chosen.latest_version_no ?? 0) - i).map((n) => (
                      <option key={n} value={n}>
                        Version {n}
                        {n === chosen.latest_version_no ? " (latest)" : ""}
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-[#203028] md:col-span-2">
                Note for the Grammarian (optional)
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={500} aria-label="Note for the Grammarian" className="mt-1 block w-full rounded-lg border border-[#dfe8df] px-2.5 py-2 text-sm" placeholder="e.g. Final manuscript after the Final Defense. Please check before Friday." />
              </label>
              {chosen && !chosen.final_defense_passed && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 md:col-span-2">
                  {chosen.group_name} has not passed its Final Defense yet (now at {chosen.current_phase}). Send it only if this is an exception.
                </p>
              )}
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button type="button" disabled={busy || !chosen || versionNo === ""} onClick={() => void send()} className="rounded-full bg-[#123f2b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                  {busy ? "Sending..." : "Send to the Grammarian"}
                </button>
                <button type="button" disabled={!chosen || versionNo === ""} onClick={() => void readManuscript()} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-5 py-2 text-sm font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50">
                  View manuscript
                </button>
              </div>
            </div>
          )}
        </section>

        <section aria-label="What was sent">
          <h3 className="mb-3 text-base font-semibold text-[#203028]">Sent to the Grammarian ({referrals?.length ?? 0})</h3>
          {!referrals && !error && <p className="text-sm text-[#7b877f]">Loading...</p>}
          {referrals && referrals.length === 0 && <p className="rounded-2xl border border-dashed border-[#cfd9d1] bg-white p-6 text-center text-sm text-[#7b877f]">Nothing has been sent yet.</p>}
          <ul className="space-y-3">
            {(referrals ?? []).map((r) => {
              const [text, style] = chip(r);

              return (
                <li key={r.referral_id} className="rounded-2xl border border-[#dfe8df] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#203028]">
                        {r.group_name} <span className="font-normal text-[#59645d]">&middot; version {r.version_no}</span>
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style}`}>{text}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#59645d]">
                        {r.course} {r.section} &middot; Sent {formatDateTime(r.sent_at)}
                        {r.decided_at && ` · Answered ${formatDateTime(r.decided_at)}`}
                      </p>
                      {r.note && <p className="mt-1 break-words text-xs italic text-[#7b877f]">You wrote: &ldquo;{r.note}&rdquo;</p>}
                      {r.status === "Not Passed" && r.remarks && (
                        <p className="mt-1 break-words rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                          <span className="font-semibold">Grammarian:</span> {r.remarks}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.status === "Passed" && (
                        <button type="button" onClick={() => setOpenId(openId === r.referral_id ? null : r.referral_id)} aria-expanded={openId === r.referral_id} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-1.5 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                          {openId === r.referral_id ? "Hide certificate" : `Open certificate ${r.certificate_no ?? ""}`}
                        </button>
                      )}
                      {r.status === "Not Passed" && candidates?.some((c) => c.project_id === r.project_id) && (
                        <button type="button" onClick={() => { choose(r.project_id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                          Send again
                        </button>
                      )}
                    </div>
                  </div>
                  {r.status === "Passed" && openId === r.referral_id && (
                    <div className="mt-3 border-t border-[#edf2ec] pt-3">
                      <CertificateList projectId={r.project_id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {reading &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-3 sm:p-4">
            <div role="dialog" aria-modal="true" aria-label="Manuscript" className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-[#edf2ec] bg-[#f3f8f4] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]">Manuscript (read only)</p>
                  <h3 className="mt-0.5 break-words text-base font-semibold text-[#203028]">{reading.title}</h3>
                </div>
                <button type="button" onClick={() => setReading(null)} className="shrink-0 rounded-full border border-[#dfe8df] bg-white px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                {reading.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{reading.error}</p>}
                {!reading.error && !reading.content && <p className="text-sm text-[#7b877f]">Opening the manuscript...</p>}
                {reading.content && <ManuscriptView content={reading.content} />}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </DeanShell>
  );
}
