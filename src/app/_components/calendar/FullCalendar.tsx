"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { CalendarEvent } from "../../_lib/calendarEvents";
import type { CalendarNote } from "../../_lib/profile";

// One drawn icon size for every button in the calendar's top bar.
function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// The calendar at full size (the consultant's request, 2026-11-26): month, week and day views ("zoom") so every defense can be seen at a glance, with its time and room.
// Defenses are placed on a time grid by their start and end; due dates and personal notes sit in an "all day" row. Click a defense or a due date to open it.
type View = "month" | "week" | "day";

const VIEWS: View[] = ["month", "week", "day"];
const VIEW_LABEL: Record<View, string> = { month: "Month", week: "Week", day: "Day" };
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_PX = 56;

const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
};
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const startOfWeek = (date: Date) => addDays(date, -date.getDay());
const minutesOf = (time: string | null | undefined) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};
const clock = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
};
const hourLabel = (hour: number) => `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;

type Placed = { event: CalendarEvent; start: number; end: number; lane: number; lanes: number };

// Defenses of one day side by side when their times overlap (two rooms at once), each as wide as the room left.
function place(events: CalendarEvent[]): Placed[] {
  const timed = events
    .map((event) => ({ event, start: minutesOf(event.time) ?? 0, end: minutesOf(event.endTime) ?? (minutesOf(event.time) ?? 0) + 60 }))
    .filter((item) => item.event.time)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const result: Placed[] = [];
  let group: Placed[] = [];
  let groupEnd = -1;

  const close = () => {
    const lanes = Math.max(1, ...group.map((item) => item.lane + 1));
    group.forEach((item) => (item.lanes = lanes));
    result.push(...group);
    group = [];
  };

  for (const item of timed) {
    if (group.length > 0 && item.start >= groupEnd) close();

    const taken = new Set(group.filter((other) => other.end > item.start).map((other) => other.lane));
    let lane = 0;
    while (taken.has(lane)) lane += 1;

    group.push({ ...item, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, item.end);
  }

  close();

  return result;
}

export default function FullCalendar({
  title,
  events,
  notes,
  onClose,
  startDate,
}: {
  title: string;
  events: CalendarEvent[];
  notes: CalendarNote[];
  onClose: () => void;
  startDate?: string;
}) {
  const todayKey = keyOf(new Date());
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => (startDate ? parseKey(startDate) : new Date()));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) map.set(event.date, [...(map.get(event.date) ?? []), event]);

    return map;
  }, [events]);
  const notesByDay = useMemo(() => {
    const map = new Map<string, CalendarNote[]>();
    for (const note of notes) map.set(note.date, [...(map.get(note.date) ?? []), note]);

    return map;
  }, [notes]);

  function zoom(direction: 1 | -1) {
    const next = VIEWS[Math.min(VIEWS.length - 1, Math.max(0, VIEWS.indexOf(view) + direction))];
    setView(next);
  }

  function step(direction: 1 | -1) {
    if (view === "month") setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
    else setAnchor(addDays(anchor, direction * (view === "week" ? 7 : 1)));
  }

  function openDay(key: string) {
    setAnchor(parseKey(key));
    setView("day");
  }

  const heading =
    view === "month"
      ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : view === "day"
        ? anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : (() => {
            const first = startOfWeek(anchor);
            const last = addDays(first, 6);

            return `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
          })();

  // The four round-corner icon buttons and the close button are all the same 36 px square with the same drawn 16 px icon (typed < > + − x each sit differently in their box).
  const iconButtonClass = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-[#203028] transition hover:bg-[#f3f7f1] disabled:opacity-40";
  const buttonClass = "flex h-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white px-3 text-xs font-semibold text-[#203028] transition hover:bg-[#f3f7f1] disabled:opacity-40";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex shrink-0 flex-wrap items-center gap-3 bg-[#154530] px-4 py-3 text-white sm:px-6">
        <h2 className="mr-2 text-base font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Previous" className={iconButtonClass}>
            <Icon path="M10 3.5L5.5 8l4.5 4.5" />
          </button>
          <button type="button" onClick={() => setAnchor(new Date())} className={buttonClass}>
            Today
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next" className={iconButtonClass}>
            <Icon path="M6 3.5L10.5 8 6 12.5" />
          </button>
        </div>
        <p className="min-w-0 flex-1 text-base font-semibold sm:text-lg">{heading}</p>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => zoom(-1)} disabled={view === "month"} aria-label="Zoom out" className={iconButtonClass}>
            <Icon path="M3.5 8h9" />
          </button>
          <div className="flex overflow-hidden rounded-lg border border-[#dfe8df]" role="tablist" aria-label="View">
            {VIEWS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={view === item}
                onClick={() => setView(item)}
                className={`h-9 px-3 text-xs font-semibold transition ${view === item ? "bg-[#a8e87a] text-[#123f2b]" : "bg-white text-[#203028] hover:bg-[#f3f7f1]"}`}
              >
                {VIEW_LABEL[item]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => zoom(1)} disabled={view === "day"} aria-label="Zoom in" className={iconButtonClass}>
            <Icon path="M8 3.5v9M3.5 8h9" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close the calendar" className={`${iconButtonClass} ml-1`}>
            <Icon path="M4 4l8 8M12 4L4 12" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-[#edf2ec] px-4 py-2 text-[11px] text-[#59645d] sm:px-6">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#123f2b]" /> Defense
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#a8e87a]" /> Due date
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#fff1f0] ring-1 ring-[#f0b8b2]" /> Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-[#9ba69d] bg-white" /> My note
        </span>
        <span className="text-[#9aa59e]">Click a defense or a due date to open it. Use + and − to zoom.</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {view === "month" && <MonthView anchor={anchor} todayKey={todayKey} byDay={byDay} notesByDay={notesByDay} onOpenDay={openDay} />}
        {view !== "month" && (
          <TimeView
            days={view === "week" ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchor), index)) : [anchor]}
            todayKey={todayKey}
            byDay={byDay}
            notesByDay={notesByDay}
            onOpenDay={openDay}
            single={view === "day"}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

function Chip({ event }: { event: CalendarEvent }) {
  const defense = event.kind === "Defense";
  // An assignment that is past its date and not finished is drawn in red, like on the dashboard calendar.
  const late = event.kind === "Due" && !event.done && event.date < keyOf(new Date());

  return (
    <Link
      href={event.href}
      title={`${event.title}${event.detail ? ` · ${event.detail}` : ""}`}
      className={`block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${event.done ? "opacity-55" : ""} ${
        defense ? "bg-[#123f2b] text-white hover:bg-[#0f3324]" : late ? "bg-[#fff1f0] text-[#b42318] ring-1 ring-[#f0b8b2] hover:bg-[#ffe4e1]" : "bg-[#a8e87a] text-[#123f2b] hover:bg-[#96dc66]"
      }`}
    >
      {defense && event.time ? `${clock(minutesOf(event.time) ?? 0)} ` : ""}
      {event.title}
    </Link>
  );
}

function NoteChip({ note }: { note: CalendarNote }) {
  return (
    <span title={`${note.title} (${note.category})`} className="block truncate rounded-md border border-[#cfd8d1] bg-white px-1.5 py-0.5 text-[11px] text-[#203028]">
      {note.title}
    </span>
  );
}

function MonthView({
  anchor,
  todayKey,
  byDay,
  notesByDay,
  onOpenDay,
}: {
  anchor: Date;
  todayKey: string;
  byDay: Map<string, CalendarEvent[]>;
  notesByDay: Map<string, CalendarNote[]>;
  onOpenDay: (key: string) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const weeks = Math.ceil((first.getDay() + new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, index) => addDays(startOfWeek(first), index));
  const SHOWN = 3;

  return (
    <div className="flex h-full min-h-[34rem] min-w-[44rem] flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-[#edf2ec] bg-[#f7faf6] text-center text-[11px] font-semibold text-[#59645d]">
        {WEEK_DAYS.map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {days.map((date) => {
          const key = keyOf(date);
          const items = [...(byDay.get(key) ?? []).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"))];
          const dayNotes = notesByDay.get(key) ?? [];
          const total = items.length + dayNotes.length;
          const rows: { type: "event" | "note"; index: number }[] = [
            ...items.map((_, index) => ({ type: "event" as const, index })),
            ...dayNotes.map((_, index) => ({ type: "note" as const, index })),
          ];

          return (
            <div key={key} className={`min-h-[5.5rem] overflow-hidden border-b border-r border-[#edf2ec] p-1.5 ${date.getMonth() === anchor.getMonth() ? "bg-white" : "bg-[#fafbf9]"}`}>
              <button
                type="button"
                onClick={() => onOpenDay(key)}
                aria-label={`Open ${date.toDateString()}`}
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  key === todayKey ? "bg-[#123f2b] text-white" : date.getMonth() === anchor.getMonth() ? "text-[#203028] hover:bg-[#f3f7f1]" : "text-[#b9c0bb] hover:bg-[#f3f7f1]"
                }`}
              >
                {date.getDate()}
              </button>
              <div className="space-y-1">
                {rows.slice(0, SHOWN).map((row) =>
                  row.type === "event" ? <Chip key={items[row.index].id} event={items[row.index]} /> : <NoteChip key={dayNotes[row.index].id} note={dayNotes[row.index]} />,
                )}
                {total > SHOWN && (
                  <button type="button" onClick={() => onOpenDay(key)} className="px-1 text-[11px] font-semibold text-[#2f6b3c] hover:underline">
                    + {total - SHOWN} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeView({
  days,
  todayKey,
  byDay,
  notesByDay,
  onOpenDay,
  single,
}: {
  days: Date[];
  todayKey: string;
  byDay: Map<string, CalendarEvent[]>;
  notesByDay: Map<string, CalendarNote[]>;
  onOpenDay: (key: string) => void;
  single: boolean;
}) {
  const placed = days.map((date) => place(byDay.get(keyOf(date)) ?? []));
  const all = placed.flat();
  const firstHour = Math.min(7, ...all.map((item) => Math.floor(item.start / 60)));
  const lastHour = Math.max(19, ...all.map((item) => Math.ceil(item.end / 60)));
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index);
  const height = hours.length * HOUR_PX;
  const columns = `3.5rem repeat(${days.length}, minmax(${single ? "16rem" : "9rem"}, 1fr))`;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="min-w-[44rem]">
      <div className="sticky top-0 z-20 grid border-b border-[#edf2ec] bg-white" style={{ gridTemplateColumns: columns }}>
        <span />
        {days.map((date) => {
          const key = keyOf(date);
          const allDay = (byDay.get(key) ?? []).filter((event) => !event.time);
          const dayNotes = notesByDay.get(key) ?? [];

          return (
            <div key={key} className="border-l border-[#edf2ec] px-2 py-2">
              <button type="button" onClick={() => !single && onOpenDay(key)} className="flex items-center gap-2 text-left" disabled={single}>
                <span className="text-[11px] font-semibold text-[#59645d]">{WEEK_DAYS[date.getDay()]}</span>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${key === todayKey ? "bg-[#123f2b] text-white" : "text-[#203028]"}`}>{date.getDate()}</span>
              </button>
              <div className="mt-1 space-y-1">
                {allDay.map((event) => (
                  <Chip key={event.id} event={event} />
                ))}
                {dayNotes.map((note) => (
                  <NoteChip key={note.id} note={note} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: columns }}>
        <div className="relative" style={{ height }}>
          {hours.map((hour, index) => (
            <span key={hour} className="absolute right-2 -translate-y-1/2 text-[10px] text-[#9aa59e]" style={{ top: index * HOUR_PX, display: index === 0 ? "none" : undefined }}>
              {hourLabel(hour)}
            </span>
          ))}
        </div>

        {days.map((date, dayIndex) => {
          const key = keyOf(date);

          return (
            <div key={key} className="relative border-l border-[#edf2ec]" style={{ height }}>
              {hours.map((hour, index) => (
                <div key={hour} className="absolute left-0 right-0 border-t border-[#f0f4ef]" style={{ top: index * HOUR_PX }} />
              ))}

              {key === todayKey && nowMinutes >= firstHour * 60 && nowMinutes <= lastHour * 60 && (
                <div className="absolute left-0 right-0 z-10 border-t-2 border-[#4ac214]" style={{ top: ((nowMinutes - firstHour * 60) / 60) * HOUR_PX }} />
              )}

              {placed[dayIndex].map(({ event, start, end, lane, lanes }) => {
                const top = ((start - firstHour * 60) / 60) * HOUR_PX;
                const blockHeight = Math.max(26, ((end - start) / 60) * HOUR_PX - 2);

                return (
                  <Link
                    key={event.id}
                    href={event.href}
                    title={`${event.title} · ${event.detail}`}
                    className={`absolute overflow-hidden rounded-lg border border-white bg-[#123f2b] p-1.5 text-white shadow-sm transition hover:bg-[#0f3324] ${event.done ? "opacity-60" : ""}`}
                    style={{ top, height: blockHeight, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                  >
                    <span className="block truncate text-[11px] font-semibold leading-4">{event.title}</span>
                    <span className="block truncate text-[10px] leading-4 text-white/75">
                      {clock(start)} – {clock(end)}
                      {event.venue ? ` · ${event.venue}` : ""}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {all.length === 0 && days.every((date) => (byDay.get(keyOf(date)) ?? []).length === 0 && (notesByDay.get(keyOf(date)) ?? []).length === 0) && (
        <p className="px-6 py-6 text-center text-sm text-[#9aa59e]">Nothing scheduled {single ? "on this day" : "this week"}.</p>
      )}
    </div>
  );
}
