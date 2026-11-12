"use client";

import { useCallback, useEffect, useState } from "react";
import DeanShell from "../_components/DeanShell";
import CertificateList from "../../_components/certificates/CertificateList";
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

  function choose(id: number | "") {
    setProjectId(id);
    const candidate = candidates?.find((c) => c.project_id === id);
    setVersionNo(candidate?.latest_version_no ?? "");
    setDone("");
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
          {candidates && candidates.length === 0 ? (
            <p className="mt-2 text-sm text-[#7b877f]">No group can be sent right now: a group needs a submitted manuscript version, and a group already with the Grammarian has to be answered first.</p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="text-xs font-semibold text-[#203028]">
                Group
                <select value={projectId} onChange={(event) => choose(event.target.value ? Number(event.target.value) : "")} aria-label="Group" className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 py-2 text-sm">
                  <option value="">Choose a group...</option>
                  {(candidates ?? []).map((c) => (
                    <option key={c.project_id} value={c.project_id}>
                      {c.group_name} ({c.course} {c.section}){c.status === "Not Passed" ? " - returned before" : c.status === "Passed" ? " - certificate received" : ""}
                    </option>
                  ))}
                </select>
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
              <div className="md:col-span-2">
                <button type="button" disabled={busy || !chosen || versionNo === ""} onClick={() => void send()} className="rounded-full bg-[#123f2b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                  {busy ? "Sending..." : "Send to the Grammarian"}
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
    </DeanShell>
  );
}
