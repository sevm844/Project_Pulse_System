"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatTime, todayInManila, type ApiDefense } from "../../_lib/defenses";
import { formatDate } from "../../_lib/requirements";
import { hasRubric } from "../../_lib/rubric";
import { getStoredUserName } from "../../_utils/authStorage";
import DashboardCard, { HeroCard, heroEyebrowClass, heroTextClass, heroTitleClass } from "../DashboardCard";
import CardHeading from "../CardHeading";

// The panelist's landing page, made to feel alive but still plain to read: a greeting with the next defense counting down, rings
// that show how far along the panelist is, and a timeline of today. Everything is worked out from the defenses the panelist is on.

const MANILA = "+08:00";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const startOf = (d: ApiDefense) => Date.parse(`${d.defense_date}T${d.defense_time}:00${MANILA}`);
const endOf = (d: ApiDefense) => startOf(d) + (d.duration_minutes || 60) * 60_000;
const submitted = (d: ApiDefense) => Boolean(d.my_evaluation);
const pad = (n: number) => String(n).padStart(2, "0");

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

function greeting(now: number) {
  const hour = Number(new Date(now).toLocaleString("en-US", { timeZone: "Asia/Manila", hour: "numeric", hour12: false })) % 24;

  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

// "01:20:35" while the defense is within a day, otherwise "in 3 days".
function countdown(ms: number) {
  if (ms >= 86_400_000) {
    const days = Math.round(ms / 86_400_000);

    return { big: `in ${days} day${days === 1 ? "" : "s"}`, mono: false };
  }
  const total = Math.max(0, Math.floor(ms / 1000));

  return { big: `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`, mono: true };
}

function Ring({ value, max, children }: { value: number; max: number; children: ReactNode }) {
  const radius = 26;
  const length = 2 * Math.PI * radius;
  const fraction = max > 0 ? Math.min(1, value / max) : 0;

  return (
    <div className="relative grid h-[68px] w-[68px] shrink-0 place-items-center" role="img" aria-label={`${value} of ${max}`}>
      <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90">
        <circle cx="34" cy="34" r={radius} fill="none" stroke="#e8f1ea" strokeWidth="7" />
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke="#4f8f58"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - fraction)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="relative text-sm font-semibold text-[#203028]">{children}</span>
    </div>
  );
}

export default function PanelistHero({ defenses, loading, onOpen }: { defenses: ApiDefense[]; loading: boolean; onOpen: (defenseId: number) => void }) {
  const now = useNow(1000);
  const today = todayInManila();
  const name = getStoredUserName() ?? "";

  const mine = useMemo(() => defenses.filter((d) => d.status !== "Cancelled" && d.defense_date && d.defense_time), [defenses]);
  const upcoming = useMemo(() => mine.filter((d) => d.status === "Scheduled").sort((a, b) => startOf(a) - startOf(b)), [mine]);
  const todays = useMemo(() => mine.filter((d) => d.defense_date === today).sort((a, b) => startOf(a) - startOf(b)), [mine, today]);

  // The one to look at now: the one in progress, else the next to start; one that already ended but still waits for the result comes last.
  const next = upcoming.find((d) => endOf(d) > now) ?? upcoming[0] ?? null;
  const toSubmit = upcoming.filter((d) => !submitted(d) && d.defense_date! <= today).length;
  const doneToday = todays.filter((d) => d.status === "Completed" || submitted(d)).length;
  const submittedAll = mine.filter(submitted).length;
  const allCaughtUp = mine.length > 0 && upcoming.every(submitted) && mine.every((d) => d.status === "Completed" || submitted(d));

  const live = next ? now >= startOf(next) && now < endOf(next) : false;
  const over = next ? now >= endOf(next) : false;
  const timer = next ? countdown(live ? endOf(next) - now : startOf(next) - now) : null;
  const opens = next ? next.defense_date! <= today : false;
  const rubricLink = next && hasRubric(next.defense_type) && (opens || submitted(next));

  const summary = loading
    ? "Checking your schedule..."
    : todays.length > 0
      ? `You have ${todays.length} defense${todays.length === 1 ? "" : "s"} today${toSubmit > 0 ? ` and ${toSubmit} evaluation${toSubmit === 1 ? "" : "s"} to submit.` : ". Thank you for being on the panel."}`
      : next
        ? "Nothing today. Your next defense is coming up."
        : "No defenses on your panel yet. They will appear here the moment you are assigned.";

  return (
    <div className="space-y-5">
      {/* hero */}
      <HeroCard tone="green">
        <div role="region" aria-label="Welcome" className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="p-6 sm:p-7">
            <p className={heroEyebrowClass("green")}>{formatDate(today)}</p>
            <h1 className={heroTitleClass}>
              {greeting(now)}
              {name ? `, ${name}` : ""}
            </h1>
            <p className={heroTextClass}>{summary}</p>

            {/* plain text, not pills: nothing here can be clicked */}
            {!loading && (todays.length > 0 || toSubmit > 0) && (
              <p className="mt-4 text-sm text-white/80">
                {todays.length > 0 && <span className="font-semibold">{todays.length} today</span>}
                {toSubmit > 0 && <span className="font-semibold text-amber-300">{todays.length > 0 ? " · " : ""}{toSubmit} to submit</span>}
              </p>
            )}
          </div>

          {/* the next defense, as a page torn from a wall calendar */}
          <div className="p-5 sm:p-6 lg:pl-0">
            <div className="flex overflow-hidden rounded-xl border border-[#d6e3d6] bg-white shadow-[0_8px_24px_rgba(31,42,36,0.12)]">
              {next && (
                <div className="flex w-20 shrink-0 flex-col items-center bg-[#2f6b3c] py-3 text-white">
                  <span className="text-xs font-semibold uppercase tracking-wide">{MONTHS[Number(next.defense_date!.slice(5, 7)) - 1]}</span>
                  <span className="text-3xl font-semibold leading-tight">{Number(next.defense_date!.slice(8, 10))}</span>
                </div>
              )}
              <div className="min-w-0 flex-1 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b877f]">{live ? "Happening now" : "Next defense"}</p>

            {next ? (
              <>
                <p className="mt-2 text-lg font-semibold leading-snug text-[#203028]">{next.group_name}</p>
                <p className="text-sm text-[#59645d]">
                  {next.defense_type} · {next.course} {next.section}
                </p>
                <p className="mt-1 text-sm text-[#7b877f]">
                  {formatDate(next.defense_date)} · {formatTime(next.defense_time)} to {formatTime(next.end_time)} · {next.venue}
                </p>

                {over ? (
                  <p className="mt-3 text-sm font-semibold text-amber-700">{submitted(next) ? "Rubric sent. Waiting for the Dean's result." : "The defense has ended. Submit your rubric."}</p>
                ) : (
                  timer && (
                    <p role="timer" className="mt-3 text-sm text-[#59645d]">
                      <span className="text-2xl font-semibold tabular-nums text-[#203028]">{timer.big}</span> {live ? "left in this defense" : "until it starts"}
                    </p>
                  )
                )}

                <div className="mt-4">
                  {rubricLink ? (
                    <Link href={`/panelist/rubric/${next.defense_id}`} className="inline-block rounded-lg bg-[#2f6b3c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245530]">
                      {submitted(next) ? "Open my rubric" : "Fill in the rubric"}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => onOpen(next.defense_id)} className="rounded-lg bg-[#2f6b3c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245530]">
                      Read the group&apos;s documents
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg font-semibold text-[#203028]">{loading ? "Loading..." : "Nothing scheduled"}</p>
                <p className="mt-1 text-sm text-[#7b877f]">{loading ? "" : "When a defense is scheduled, it shows here."}</p>
              </>
            )}
              </div>
            </div>
          </div>
        </div>
      </HeroCard>

      {/* where you stand */}
      <div className="grid gap-5 md:grid-cols-3">
        <DashboardCard className="flex items-center gap-4 p-5">
          <Ring value={doneToday} max={todays.length}>
            {loading ? "–" : `${doneToday}/${todays.length}`}
          </Ring>
          <div>
            <p className="text-sm font-semibold text-[#203028]">Today</p>
            <p className="text-xs leading-5 text-[#7b877f]">{todays.length === 0 ? "No defense today" : `${doneToday} of ${todays.length} done`}</p>
          </div>
        </DashboardCard>

        <DashboardCard className="flex items-center gap-4 p-5">
          <Ring value={submittedAll} max={mine.length}>
            {loading ? "–" : `${submittedAll}/${mine.length}`}
          </Ring>
          <div>
            <p className="text-sm font-semibold text-[#203028]">Evaluations</p>
            <p className="text-xs leading-5 text-[#7b877f]">{mine.length === 0 ? "Nothing to evaluate yet" : `${submittedAll} of ${mine.length} submitted`}</p>
          </div>
        </DashboardCard>

        <DashboardCard className="flex items-center gap-4 p-5">
          <div className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full bg-[#eef7ee] text-2xl font-semibold text-[#123f2b]">{loading ? "–" : upcoming.length}</div>
          <div>
            <p className="text-sm font-semibold text-[#203028]">Coming up</p>
            <p className="text-xs leading-5 text-[#7b877f]">{upcoming.length === 0 ? "No upcoming defenses" : next ? `Next: ${formatDate(next.defense_date)}` : ""}</p>
          </div>
        </DashboardCard>
      </div>

      {allCaughtUp && (
        <p role="status" className="flex items-center gap-3 rounded-2xl border border-[#cfe8d2] bg-[#f2fbef] px-5 py-4 text-sm text-[#2f6b3c]">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-[#4f8f58] text-white motion-safe:animate-[pop_0.5s_ease-out]">
            ✓
          </span>
          <span>
            <span className="font-semibold">All caught up.</span> Every defense you were on has your evaluation. Thank you for your time and your care for the students.
          </span>
        </p>
      )}

      {/* today as a timeline */}
      <DashboardCard className="p-5">
        <CardHeading title="Today" tone="mint" right={<span className="text-xs text-[#d7f7d8]">{formatDate(today)}</span>} />

        {todays.length === 0 ? (
          <p className="rounded-xl bg-[#f8faf7] p-4 text-sm leading-6 text-[#7b877f]">
            {loading ? "Loading..." : next ? `No defense today. Enjoy the quiet: your next one is the ${next.defense_type} of ${next.group_name} on ${formatDate(next.defense_date)}.` : "No defense today."}
          </p>
        ) : (
          <ol>
            {todays.map((d, index) => {
              const isLive = now >= startOf(d) && now < endOf(d) && d.status === "Scheduled";
              const finished = d.status === "Completed" || submitted(d);
              const last = index === todays.length - 1;

              return (
                <li key={d.defense_id} className="relative flex gap-4 pb-5 last:pb-0">
                  {!last && <span aria-hidden className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px bg-[#dfe8df]" />}
                  <span
                    aria-hidden
                    className={`relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      finished ? "bg-[#4f8f58] text-white" : isLive ? "bg-amber-400 text-[#3d2e00] motion-safe:animate-pulse" : "border-2 border-[#c9d3cc] bg-white text-transparent"
                    }`}
                  >
                    {finished ? "✓" : "•"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-xs font-semibold text-[#59645d]">
                        {formatTime(d.defense_time)} - {formatTime(d.end_time)}
                      </p>
                      <span className={`text-[11px] font-semibold ${finished ? "text-[#2f6b3c]" : isLive ? "text-amber-700" : "text-[#7b877f]"}`}>
                        {d.status === "Completed" ? "Result recorded" : submitted(d) ? "Rubric submitted" : isLive ? "Happening now" : now > endOf(d) ? "Ended" : "Later today"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-[#203028]">
                      {d.group_name} <span className="font-normal text-[#7b877f]">· {d.defense_type}</span>
                    </p>
                    <p className="text-xs text-[#7b877f]">{d.venue}</p>
                    <div className="mt-1.5 flex gap-3 text-xs font-semibold">
                      {hasRubric(d.defense_type) && d.status === "Scheduled" && (
                        <Link href={`/panelist/rubric/${d.defense_id}`} className="text-[#4f8f58] hover:underline">
                          {submitted(d) ? "Open my rubric" : "Fill in the rubric"}
                        </Link>
                      )}
                      <button type="button" onClick={() => onOpen(d.defense_id)} className="text-[#59645d] hover:underline">
                        Details
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </DashboardCard>
    </div>
  );
}
