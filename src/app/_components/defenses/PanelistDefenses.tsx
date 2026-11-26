"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { apiFetch } from "../../_lib/api";
import {
  DEFENSE_RECOMMENDATIONS,
  defenseState,
  formatTime,
  todayInManila,
  type ApiDefense,
} from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";
import { hasRubric } from "../../_lib/rubric";
import DashboardCard from "../DashboardCard";
import CardHeading from "../CardHeading";
import PanelistHero from "./PanelistHero";
import { focusId, readFocus, scrollToFocus } from "../../_lib/focus";
import DefenseDocuments from "./DefenseDocuments";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

export default function PanelistDefenses() {
  const [defenses, setDefenses] = useState<ApiDefense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "done">("upcoming");
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setDefenses(await apiFetch<ApiDefense[]>("/defenses"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load your defenses."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  // A notice may name one defense (?defense=7): show the tab it is in, open it and scroll to it, once.
  const focusDone = useRef(false);

  useEffect(() => {
    if (loading || focusDone.current) return;
    focusDone.current = true;

    const wanted = readFocus().defense;
    const target = wanted ? defenses.find((item) => item.defense_id === wanted) : undefined;

    if (!target) return;

    queueMicrotask(() => {
      setTab(target.status === "Scheduled" ? "upcoming" : "done");
      setOpenId(target.defense_id);
    });
    scrollToFocus(focusId.defense(target.defense_id));
  }, [loading, defenses]);

  const upcoming = defenses.filter((item) => item.status === "Scheduled");
  const done = defenses.filter((item) => item.status !== "Scheduled");
  const visible = tab === "upcoming" ? upcoming : done;

  return (
    <div className="space-y-6">
      <PanelistHero
        defenses={defenses}
        loading={loading}
        onOpen={(id) => {
          setTab("upcoming");
          setOpenId(id);
          document.getElementById("defense-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <DashboardCard className="p-5">
      <CardHeading title="Your defenses" tone="aqua" />
      <div id="defense-list" className="-mt-2 scroll-mt-6" />
      <div className="flex gap-5 border-b border-[#edf2ec] text-xs font-semibold">
        {(
          [
            ["upcoming", `Upcoming (${upcoming.length})`],
            ["done", `Done (${done.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-3 ${
              tab === key ? "border-[#123f2b] text-[#203028]" : "border-transparent text-[#9aa59e] hover:text-[#59645d]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 text-sm text-[#2f6f3a]">
          {notice}
        </p>
      )}

      {!loading && visible.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-[#f8faf7] p-4 text-center text-sm text-[#7b877f]">
          {tab === "upcoming" ? "You have no upcoming defenses." : "Nothing here yet."}
        </p>
      )}

      <ul className="divide-y divide-[#edf2ec]">
        {visible.map((defense) => (
          <PanelistRow
            key={defense.defense_id}
            defense={defense}
            open={openId === defense.defense_id}
            onToggle={() => {
              setNotice("");
              setOpenId(openId === defense.defense_id ? null : defense.defense_id);
            }}
            onSaved={async (message) => {
              setNotice(message);
              await load();
            }}
          />
        ))}
      </ul>
      </DashboardCard>
    </div>
  );
}

function PanelistRow({
  defense,
  open,
  onToggle,
  onSaved,
}: {
  defense: ApiDefense;
  open: boolean;
  onToggle: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const mine = defense.my_evaluation;
  const [score, setScore] = useState(mine?.score != null ? String(mine.score) : "");
  const [recommendation, setRecommendation] = useState<string>(mine?.recommendation ?? DEFENSE_RECOMMENDATIONS[0]);
  const [remarks, setRemarks] = useState(mine?.remarks ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const state = defenseState(defense);
  const opensToday = (defense.defense_date ?? "") <= todayInManila();
  const canEvaluate = defense.status === "Scheduled" && opensToday;
  const chair = defense.panel.find((member) => member.role === "Chair");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await apiFetch(`/defenses/${defense.defense_id}/evaluation`, {
        method: "PUT",
        body: JSON.stringify({
          score: Number(score),
          recommendation,
          remarks: remarks.trim() || null,
        }),
      });

      await onSaved(`${defense.group_name}: evaluation saved.`);
    } catch (err) {
      setMessage(errorMessage(err, "Unable to save the evaluation."));
    }

    setSaving(false);
  }

  return (
    <li id={focusId.defense(defense.defense_id)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#203028]">
            {defense.group_name} · {defense.defense_type}
          </p>
          <p className="mt-0.5 text-xs text-[#7b877f]">
            {formatDate(defense.defense_date)} · {formatTime(defense.defense_time)} · {defense.venue}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-2 text-xs text-[#59645d]">
          <span className={`h-2 w-2 rounded-full ${mine && defense.status === "Scheduled" ? "bg-emerald-500" : state.dot}`} />
          {mine && defense.status === "Scheduled" ? "Evaluated" : state.label}
        </span>
      </button>

      {open && (
        <div className="space-y-5 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4 text-sm">
          <p className="text-xs text-[#7b877f]">
            {defense.course} {defense.section}
            {` · ${defense.project_title ?? "No title chosen yet"}`}
            {chair ? ` · Chair ${chair.name}` : ""}
          </p>

          <DefenseDocuments defenseId={defense.defense_id} />

          {defense.status === "Completed" && (
            <p className="text-xs text-[#59645d]">
              <span className="font-semibold text-[#203028]">Result: {defense.result}.</span>
              {defense.remarks ? ` ${defense.remarks}` : ""}
            </p>
          )}

          {defense.status === "Cancelled" && <p className="text-xs text-[#7b877f]">This defense was cancelled.</p>}

          {/* The Proposal Defense is scored on the paper rubric, which has its own page. */}
          {hasRubric(defense.defense_type) && defense.status !== "Cancelled" && (
            <div className="border-t border-[#edf2ec] pt-4">
              <p className="text-xs font-semibold text-[#203028]">Proposal Defense Rubric</p>
              <p className="mt-1 text-xs leading-5 text-[#59645d]">
                {mine?.rubric
                  ? `Your rubric: ${mine.rubric.total} / ${mine.rubric.max} · ${mine.recommendation}`
                  : canEvaluate
                    ? "Score this group on the department's rubric."
                    : "The rubric opens on the day of the defense."}
              </p>
              {(canEvaluate || mine?.rubric) && (
                <Link href={`/panelist/rubric/${defense.defense_id}`} className="mt-2 inline-block rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">
                  {mine?.rubric ? (canEvaluate ? "Open my rubric" : "View my rubric") : "Fill in the rubric"}
                </Link>
              )}
            </div>
          )}

          {defense.status !== "Cancelled" && mine && !canEvaluate && !hasRubric(defense.defense_type) && (
            <p className="text-xs text-[#59645d]">
              Your evaluation: {mine.score} · {mine.recommendation}
              {mine.remarks ? ` · ${mine.remarks}` : ""}
            </p>
          )}

          {defense.status === "Scheduled" && !opensToday && !hasRubric(defense.defense_type) && (
            <p className="text-xs text-[#7b877f]">The evaluation opens on the day of the defense.</p>
          )}

          {canEvaluate && !hasRubric(defense.defense_type) && (
            <form onSubmit={submit} className="space-y-3 border-t border-[#edf2ec] pt-4">
              <p className="text-xs font-semibold text-[#203028]">{mine ? "Update your evaluation" : "Your evaluation"}</p>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-[#59645d]">
                  Score (0 to 100)
                  <input
                    required
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    className={fieldClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-[#59645d]">
                  Recommendation
                  <select
                    value={recommendation}
                    onChange={(event) => setRecommendation(event.target.value)}
                    className={fieldClass}
                  >
                    {DEFENSE_RECOMMENDATIONS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-[#59645d]">
                Remarks {recommendation === "Pass" ? "(optional)" : "(required)"}
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className={`${fieldClass} resize-none`}
                />
              </label>

              {message && (
                <p role="alert" className="text-xs text-[#b42318]">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving || score === "" || (recommendation !== "Pass" && !remarks.trim())}
                className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
              >
                {saving ? "Saving..." : mine ? "Update evaluation" : "Submit evaluation"}
              </button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
