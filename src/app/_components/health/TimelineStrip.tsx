"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import CardHeading from "../CardHeading";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import type { ApiTimelineEvent } from "../../_lib/health";

// The capstone timeline of one group on a single horizontal line, for the top of a student's dashboard (the user's decision, 2026-11-24: the system is about the
// timeline of the capstone). It shows the last things done, a "Today" marker, and what is coming. Same data as the full timeline (GET /groups/{id}/timeline).
const KIND: Record<ApiTimelineEvent["kind"], string> = { milestone: "Milestone", assignment: "Assignment", defense: "Defense" };

function todayKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function shortDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TimelineStrip({ groupId, title = "Capstone timeline", moreHref, moreLabel = "See the full timeline" }: { groupId: number; title?: string; moreHref?: string; moreLabel?: string }) {
  const [events, setEvents] = useState<ApiTimelineEvent[] | null>(null);
  const [error, setError] = useState("");
  const todayRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiTimelineEvent[]>(`/groups/${groupId}/timeline`)
      .then((result) => {
        if (!cancelled) setEvents(result);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Unable to load the timeline."));
      });

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const items = useMemo(() => {
    const today = todayKey();
    const dated = (events ?? []).filter((event) => event.date).sort((a, b) => (a.date as string).localeCompare(b.date as string));
    const isAhead = (event: ApiTimelineEvent) => (event.date as string) > today || ((event.date as string) === today && event.state !== "done");
    const before = dated.filter((event) => !isAhead(event)).slice(-2);
    const after = dated.filter(isAhead).slice(0, 6);

    return { before, after };
  }, [events]);

  // Bring "Today" into view when the line is wider than the screen.
  useEffect(() => {
    const element = todayRef.current;
    const box = element?.parentElement?.parentElement;
    if (element && box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: Math.max(0, element.offsetLeft - 120), behavior: "auto" });
  }, [items]);

  return (
    <section className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)]" aria-label={title}>
      <CardHeading
        title={title}
        tone="mint"
        right={
          moreHref ? (
            <Link href={moreHref} className="text-xs font-semibold text-[#d7f7d8] underline">
              {moreLabel}
            </Link>
          ) : undefined
        }
      />

      {error && (
        <p role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
      )}
      {!events && !error && <p className="text-sm text-[#7b877f]">Loading your timeline...</p>}
      {events && items.before.length + items.after.length === 0 && <p className="text-sm text-[#7b877f]">No dated milestones yet. They appear here as your capstone moves forward.</p>}

      {events && items.before.length + items.after.length > 0 && (
        <div className="overflow-x-auto pb-2 pt-1">
          <ol className="relative flex min-w-max items-start">
            {items.before.map((event, index) => (
              <Node key={`b-${index}-${event.title}`} event={event} />
            ))}

            <li ref={todayRef} className="relative flex w-24 shrink-0 flex-col items-center">
              <span className="absolute left-0 right-0 top-[11px] h-px bg-[#cfe0d3]" aria-hidden />
              <span className="relative z-10 flex h-6 items-center rounded-full bg-[#123f2b] px-3 text-[11px] font-bold uppercase tracking-wide text-white">Today</span>
              <span className="mt-2 text-[11px] font-semibold text-[#123f2b]">{shortDate(todayKey())}</span>
            </li>

            {items.after.map((event, index) => (
              <Node key={`a-${index}-${event.title}`} event={event} first={index === 0} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function Node({ event, first = false }: { event: ApiTimelineEvent; first?: boolean }) {
  const late = event.state === "overdue" || event.state === "problem";
  // The icon follows the STATE only: a finished task is always the green check; a late or problem one is a red "!" (never a check).
  const done = event.state === "done";

  return (
    <li className="relative flex w-40 shrink-0 flex-col items-center px-1.5 text-center">
      <span className="absolute left-0 right-0 top-[11px] h-px bg-[#cfe0d3]" aria-hidden />
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
          late ? "border-[#b42318] bg-white text-[#b42318]" : done ? "border-[#3a7f35] bg-[#3a7f35] text-white" : first ? "border-[#123f2b] bg-white text-[#123f2b]" : "border-[#c5cdc7] bg-white text-transparent"
        }`}
      >
        {done ? "✓" : late ? "!" : "•"}
      </span>
      <span className={`mt-2 text-[11px] font-semibold ${late ? "text-[#b42318]" : "text-[#2f6b3c]"}`}>{event.date ? shortDate(event.date) : ""}</span>
      <span className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-[#203028]">{event.title}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-[#9aa59e]">{KIND[event.kind]}</span>
    </li>
  );
}
