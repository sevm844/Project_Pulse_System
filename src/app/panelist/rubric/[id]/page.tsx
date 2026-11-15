"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import PanelistShell from "../../_components/PanelistShell";
import RubricPaper from "../../../_components/defenses/RubricPaper";
import DashboardCard from "../../../_components/DashboardCard";
import { apiFetch } from "../../../_lib/api";
import { DEFENSE_RECOMMENDATIONS, todayInManila, type ApiDefense } from "../../../_lib/defenses";
import { deleteSignature, fetchSignature, saveSignature, signatureDataUrl } from "../../../_lib/certificates";
import { errorMessage } from "../../../_lib/groups";
import { getStoredUserName } from "../../../_utils/authStorage";
import { hasRubric, RUBRIC_MAX, rubricComplete, rubricTotal, submitRubric, type Ratings } from "../../../_lib/rubric";

// The Proposal Defense Rubric, filled in by one panelist on the paper form itself: click a cell for each criterion, write the
// comments, sign, and submit. The total is worked out by the page; the defense's score comes from it.
export default function PanelistRubricPage() {
  const params = useParams<{ id: string }>();
  const defenseId = Number(params.id);

  const [defense, setDefense] = useState<ApiDefense | null>(null);
  const [ratings, setRatings] = useState<Ratings>({});
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState<string>(DEFENSE_RECOMMENDATIONS[0]);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const apply = useCallback((d: ApiDefense) => {
    setDefense(d);
    if (d.my_evaluation?.rubric) {
      setRatings(d.my_evaluation.rubric.ratings);
      setComments(d.my_evaluation.remarks ?? "");
      setRecommendation(d.my_evaluation.recommendation ?? DEFENSE_RECOMMENDATIONS[0]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await apiFetch<ApiDefense[]>("/defenses");
        const mine = list.find((d) => d.defense_id === defenseId);
        if (!mine) throw new Error("This defense was not found among yours.");
        if (cancelled) return;
        apply(mine);
        setSignature(await fetchSignature().catch(() => null));
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Unable to open this rubric."));
      }

      if (!cancelled) setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [defenseId, apply]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
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

  async function submit() {
    if (!defense) return;
    const updating = Boolean(defense.my_evaluation);
    setBusy(true);
    setError("");
    setNotice("");

    try {
      apply(await submitRubric(defense.defense_id, ratings, recommendation, comments));
      setNotice(updating ? "Your rubric was updated." : "Your rubric was submitted. You can change it until the Dean records the result.");
    } catch (err) {
      setError(errorMessage(err, "Unable to submit your rubric."));
    }

    setBusy(false);
  }

  async function download() {
    if (!defense) return;
    setBusy(true);

    try {
      const { downloadRubricPdf } = await import("../../../_lib/manuscriptExport/rubric");
      await downloadRubricPdf({
        course: defense.course,
        groupName: defense.group_name,
        members: defense.members ?? [],
        date: defense.defense_date,
        ratings,
        comments,
        panelistName: name,
        signature,
        signedDate: defense.my_evaluation?.evaluated_at ?? todayInManila(),
      });
    } catch (err) {
      setError(errorMessage(err, "The PDF could not be made. Please try again."));
    }

    setBusy(false);
  }

  const name = getStoredUserName() ?? "";
  const today = todayInManila();
  const open = defense?.status === "Scheduled" && (defense.defense_date ?? "") <= today;
  const complete = rubricComplete(ratings);
  const needsComments = recommendation !== "Pass" && !comments.trim();
  const ready = open && complete && !needsComments && !busy;

  return (
    <PanelistShell title="Proposal Defense Rubric" hideContentTitle>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <Link href="/panelist" className="text-xs font-semibold text-[#4f8f58] hover:underline">
            ← Back to Defenses
          </Link>
        </div>

        {!loaded && <p className="text-sm text-[#7b877f]">Loading...</p>}

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {defense && !hasRubric(defense.defense_type) && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This defense is scored on the Defenses page. The rubric is only for the Proposal Defense.
          </p>
        )}

        {defense && hasRubric(defense.defense_type) && (
          <>
            <DashboardCard className="p-5">
              <h1 className="text-xl font-semibold tracking-tight text-[#203028]">
                {defense.group_name} · {defense.defense_type}
              </h1>
              <p className="mt-1 text-sm leading-6 text-[#59645d]">
                Click one box for each criterion, write your comments, then submit. The total is added for you.
                {!open && defense.status === "Scheduled" && " The rubric opens on the day of the defense."}
                {defense.status !== "Scheduled" && " This defense is closed, so the rubric can no longer be changed."}
              </p>
            </DashboardCard>

            <RubricPaper
              course={defense.course}
              groupName={defense.group_name}
              members={defense.members ?? []}
              date={defense.defense_date}
              ratings={ratings}
              onRate={open ? (key, value) => setRatings((current) => ({ ...current, [key]: value })) : undefined}
              comments={comments}
              onComments={open ? setComments : undefined}
              signature={signature}
              panelistName={name}
              signedDate={defense.my_evaluation?.evaluated_at ?? today}
            />

            <DashboardCard className="p-5">
              <h2 className="text-base font-semibold text-[#203028]">Your signature</h2>
              <p className="mt-1 text-xs leading-5 text-[#7b877f]">
                A picture of your signature is printed on the form. Upload it once; it is used for every rubric you submit.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                  {signature ? "Change signature" : "Upload signature"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} className="hidden" />
                </label>
                {signature && (
                  <button type="button" onClick={() => void removeSignature()} className="text-xs font-semibold text-[#b42318] hover:underline">
                    Remove
                  </button>
                )}
                {!signature && <span className="text-xs text-[#9aa59e]">No signature yet: the form will print with a blank line to sign by hand.</span>}
              </div>
            </DashboardCard>

            <div className="sticky bottom-0 z-20 rounded-2xl border border-[#dfe8df] bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgba(31,42,36,0.08)] backdrop-blur">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-4">
                  <p className="text-sm text-[#59645d]" aria-live="polite">
                    Total{" "}
                    <span className="text-lg font-semibold text-[#203028]">
                      {rubricTotal(ratings)} / {RUBRIC_MAX}
                    </span>
                    {!complete && <span className="ml-2 text-xs text-[#b7791f]">{Object.values(ratings).filter(Boolean).length} of 10 rated</span>}
                  </p>
                  <label className="block text-xs font-semibold text-[#59645d]">
                    Your recommendation
                    <select
                      value={recommendation}
                      disabled={!open}
                      onChange={(event) => setRecommendation(event.target.value)}
                      className="mt-1 block h-9 rounded-lg border border-[#dfe8df] bg-white px-2.5 text-xs text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8] disabled:opacity-60"
                    >
                      {DEFENSE_RECOMMENDATIONS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" disabled={!complete || busy} onClick={() => void download()} className="h-9 rounded-lg border border-[#dfe8df] bg-white px-4 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-40">
                    Print / Save as PDF
                  </button>
                  {open && (
                    <button type="button" disabled={!ready} onClick={() => void submit()} className="h-9 rounded-lg bg-[#123f2b] px-5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40">
                      {busy ? "Saving..." : defense.my_evaluation ? "Update my rubric" : "Submit my rubric"}
                    </button>
                  )}
                </div>
              </div>
              {open && needsComments && complete && <p className="mt-2 text-xs text-[#b7791f]">Write your comments: they are required when the recommendation is not Pass.</p>}
              {notice && (
                <p role="status" className="mt-2 text-xs text-[#2f6f3a]">
                  {notice}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </PanelistShell>
  );
}
