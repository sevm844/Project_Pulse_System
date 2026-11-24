"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import type { ApiTimelineEvent, TimelineState } from "../../_lib/health";
import { formatDate } from "../../_lib/requirements";

// The same round icons as the timeline on the dashboard (TimelineStrip), so a finished task always looks the same: a green check.
const icon: Record<TimelineState, { className: string; mark: string }> = {
  done: { className: "border-[#3a7f35] bg-[#3a7f35] text-white", mark: "✓" },
  waiting: { className: "border-[#123f2b] bg-white text-[#123f2b]", mark: "•" },
  soon: { className: "border-[#123f2b] bg-white text-[#123f2b]", mark: "•" },
  problem: { className: "border-[#b42318] bg-white text-[#b42318]", mark: "!" },
  overdue: { className: "border-[#b42318] bg-white text-[#b42318]", mark: "!" },
  upcoming: { className: "border-[#c5cdc7] bg-white text-transparent", mark: "•" },
};

const word: Partial<Record<TimelineState, { label: string; className: string }>> = {
  done: { label: "Done", className: "text-[#3a7f35]" },
  waiting: { label: "In review", className: "text-[#123f2b]" },
  problem: { label: "Needs attention", className: "text-[#b42318]" },
  overdue: { label: "Overdue", className: "text-[#b42318]" },
  soon: { label: "Due soon", className: "text-[#123f2b]" },
};

// Today as a plain date in the viewer's own calendar, to compare with the dates from the server.
function todayKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Every date of one group's capstone on a single line: what is done, what is late, what is coming.
export default function GroupTimeline({ groupId }: { groupId: number }) {
  const [events, setEvents] = useState<ApiTimelineEvent[] | null>(null);
  const [error, setError] = useState("");

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

  if (error) {
    return (
      <p role="alert" className="text-sm text-[#b42318]">
        {error}
      </p>
    );
  }

  if (!events) return <p className="text-sm text-[#7b877f]">Loading...</p>;

  const today = todayKey();
  const dated = events.filter((event) => event.date);
  const undated = events.filter((event) => !event.date);
  // The "Today" line goes before the first thing still ahead: later than today, or today but not done yet.
  const todayAt = dated.findIndex((event) => (event.date as string) > today || ((event.date as string) === today && event.state !== "done"));

  return (
    <div>
      <ol className="relative ml-1.5 border-l border-[#e2ebe1]">
        {dated.map((event, index) => (
          <Fragment key={`${event.title}-${index}`}>
            {index === todayAt && <TodayMarker />}
            <TimelineItem event={event} />
          </Fragment>
        ))}
        {todayAt === -1 && <TodayMarker />}
      </ol>

      {undated.length > 0 && (
        <>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa59e]">No due date</p>
          <ol className="relative ml-1.5 mt-2 border-l border-[#e2ebe1]">
            {undated.map((event, index) => (
              <TimelineItem key={`${event.title}-${index}`} event={event} />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function TodayMarker() {
  return (
    <li className="relative -ml-px flex items-center gap-3 py-2 pl-6" aria-label="Today">
      <span className="absolute -left-[5px] h-2.5 w-2.5 rotate-45 bg-[#123f2b]" />
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#123f2b]">Today</span>
      <span className="h-px flex-1 bg-[#123f2b]/20" />
    </li>
  );
}

function TimelineItem({ event }: { event: ApiTimelineEvent }) {
  const state = word[event.state];

  return (
    <li className="relative py-2.5 pl-6">
      <span className={`absolute -left-[9px] top-[11px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold ${icon[event.state].className}`}>{icon[event.state].mark}</span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-sm font-semibold text-[#203028]">
          {event.title}
          <span className="ml-2 text-[11px] font-normal uppercase tracking-wide text-[#9aa59e]">{event.kind}</span>
        </p>
        <p className="text-xs text-[#7b877f]">
          {event.date ? formatDate(event.date) : ""}
          {state && <span className={`${event.date ? "ml-3" : ""} font-semibold ${state.className}`}>{state.label}</span>}
        </p>
      </div>

      {event.detail && <p className="mt-0.5 whitespace-pre-line text-xs leading-5 text-[#7b877f]">{event.detail}</p>}
    </li>
  );
}
