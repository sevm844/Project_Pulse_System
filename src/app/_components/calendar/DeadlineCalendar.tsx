"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCalendarEvents, type CalendarEvent } from "../../_lib/calendarEvents";
import { errorMessage } from "../../_lib/groups";
import { addCalendarNote, removeCalendarNote, type CalendarNote } from "../../_lib/profile";
import { loadCalendarNotes } from "../StakeholderCalendar";

// The student's dashboard is about DEADLINES (the user's decision, 2026-11-24): a big month calendar that shows what is due on each day, and a "Coming up" list
// beside it with a countdown. Only the system's greens and white are used; today and overdue items are the strongest.
const STORAGE_KEY = "project-pulse-student-calendar-notes";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CATEGORIES = ["Daily Sync", "Tasks", "Education"];

const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
};
const dayLabel = (key: string) => parseKey(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const weeks = Math.ceil((first.getDay() + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7);

  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return { key: keyOf(date), day: date.getDate(), inMonth: date.getMonth() === month.getMonth() };
  });
}

// "Today", "Tomorrow", "In 3 days", "2 days overdue".
function countdown(dateKey: string, todayKey: string) {
  const days = Math.round((parseKey(dateKey).getTime() - parseKey(todayKey).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;

  return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`;
}

function shortTitle(event: CalendarEvent) {
  return event.kind === "Defense" ? event.title.split(":")[0] : event.title;
}

export default function DeadlineCalendar() {
  const { events, loading, failed } = useCalendarEvents("Student");
  const todayKey = keyOf(new Date());
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(todayKey);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    loadCalendarNotes(STORAGE_KEY)
      .then((saved) => !cancelled && setNotes(saved))
      .catch(() => !cancelled && setNoteError("Your notes could not be loaded. Please refresh the page."));

    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => monthDays(month), [month]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) map.set(event.date, [...(map.get(event.date) ?? []), event]);

    return map;
  }, [events]);
  const noteDays = useMemo(() => new Set(notes.map((note) => note.date)), [notes]);

  const overdue = events.filter((event) => event.kind === "Due" && event.date < todayKey && !event.done);
  const upcoming = events.filter((event) => event.date >= todayKey && !event.done);
  const comingUp = [...overdue, ...upcoming].slice(0, 7);
  const dueThisWeek = upcoming.filter((event) => event.kind === "Due" && event.date <= keyOf(new Date(Date.now() + 6 * 86400000))).length;

  const selectedEvents = byDay.get(selected) ?? [];
  const selectedNotes = notes.filter((note) => note.date === selected);

  function show(dateKey: string) {
    setSelected(dateKey);
    setMonth(parseKey(dateKey));
  }

  async function addNote() {
    const title = noteTitle.trim();
    if (!title) return;
    setNoteError("");

    try {
      const saved = await addCalendarNote({ date: selected, title, category });
      setNotes((list) => [...list, saved]);
      setNoteTitle("");
    } catch (err) {
      setNoteError(errorMessage(err, "The note could not be saved. Please try again."));
    }
  }

  async function removeNote(id: number) {
    try {
      await removeCalendarNote(id);
      setNotes((list) => list.filter((note) => note.id !== id));
    } catch (err) {
      setNoteError(errorMessage(err, "The note could not be removed. Please try again."));
    }
  }

  const chip = (event: CalendarEvent, dateKey: string) => {
    const late = event.kind === "Due" && !event.done && dateKey < todayKey;

    return event.done
      ? "bg-[#f1f3f0] text-[#9aa59e] line-through"
      : late
        ? "bg-[#fff1f0] text-[#b42318]"
        : event.kind === "Defense"
          ? "bg-[#123f2b] text-white"
          : "bg-[#d7f7d8] text-[#123f2b]";
  };

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" aria-label="Deadlines and calendar">
      <div className="order-2 overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-[0_16px_42px_rgba(31,42,36,0.07)] lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ec] px-5 py-4">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] text-[#203028] hover:bg-[#f3f7f1]">
              ‹
            </button>
            <h2 className="min-w-[10.5rem] text-center text-xl font-semibold tracking-tight text-[#203028]">
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] text-[#203028] hover:bg-[#f3f7f1]">
              ›
            </button>
            <button type="button" onClick={() => show(todayKey)} className="ml-1 rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f7f1]">
              Today
            </button>
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#59645d]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#d7f7d8] ring-1 ring-[#a8e87a]" /> Due date</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#123f2b]" /> Defense</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#fff1f0] ring-1 ring-[#f0b8b2]" /> Overdue</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#3a7f35]" /> My note</span>
          </p>
        </div>

        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]">
            {WEEK_DAYS.map((name) => (
              <span key={name} className="py-1">{name}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((item) => {
              const list = byDay.get(item.key) ?? [];
              const isToday = item.key === todayKey;
              const isSelected = item.key === selected;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelected(item.key)}
                  className={`flex min-h-[58px] flex-col items-stretch rounded-xl border p-1.5 text-left align-top transition sm:min-h-[96px] ${
                    isSelected ? "border-[#123f2b] bg-[#f3f8f4]" : item.inMonth ? "border-[#edf2ec] bg-white hover:bg-[#fbfdfb]" : "border-transparent bg-[#fafbfa]"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                        isToday ? "bg-[#123f2b] text-white" : item.inMonth ? "text-[#203028]" : "text-[#b9c0bb]"
                      }`}
                    >
                      {item.day}
                    </span>
                    {noteDays.has(item.key) && <span className="h-1.5 w-1.5 rounded-full bg-[#3a7f35]" />}
                  </span>

                  {/* On a phone only small marks show (the list beside the calendar has the words); from tablet size each deadline shows its title. */}
                  <span className="mt-1 hidden flex-1 flex-col gap-1 sm:flex">
                    {list.slice(0, 2).map((event) => (
                      <span key={event.id} className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${chip(event, item.key)}`}>
                        {shortTitle(event)}
                      </span>
                    ))}
                    {list.length > 2 && <span className="px-1 text-[10px] font-semibold text-[#59645d]">+{list.length - 2} more</span>}
                  </span>
                  <span className="mt-1 flex gap-0.5 sm:hidden">
                    {list.slice(0, 3).map((event) => (
                      <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${event.kind === "Defense" ? "bg-[#123f2b]" : "bg-[#4f8f58]"}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="order-1 space-y-5 lg:order-2">
        <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">Coming up</h2>
            {!loading && dueThisWeek > 0 && <span className="text-xs font-semibold text-[#2f6b3c]">{dueThisWeek} due this week</span>}
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-[#7b877f]">Loading your deadlines...</p>
          ) : comingUp.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[#7b877f]">{failed ? "Some dates could not be loaded." : "Nothing is due. Your deadlines and defenses will appear here."}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {comingUp.map((event) => {
                const when = countdown(event.date, todayKey);
                const late = event.date < todayKey;
                const urgent = when === "Today" || when === "Tomorrow";

                return (
                  <li key={event.id}>
                    <Link
                      href={event.href}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition hover:bg-[#f3f8f4] ${
                        late ? "border-[#f0b8b2] bg-[#fff8f7]" : urgent ? "border-[#123f2b] bg-[#f3f8f4]" : "border-[#edf2ec] bg-white"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#203028]">{shortTitle(event)}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#7b877f]">{event.detail}</span>
                      </span>
                      <span className={`shrink-0 text-right text-xs font-bold ${late ? "text-[#b42318]" : urgent ? "text-[#123f2b]" : "text-[#4f8f58]"}`}>
                        {when}
                        <span className="block text-[10px] font-medium text-[#7b877f]">{parseKey(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
          <h3 className="text-sm font-semibold text-[#203028]">{dayLabel(selected)}</h3>

          <div className="mt-3 space-y-2">
            {selectedEvents.map((event) => (
              <Link key={event.id} href={event.href} className="block rounded-xl bg-[#f3f8f4] px-3 py-2.5 hover:bg-[#e8f1ea]">
                <span className={`block text-sm font-semibold ${event.done ? "text-[#9aa59e] line-through" : "text-[#203028]"}`}>{event.title}</span>
                <span className="mt-0.5 block text-[11px] text-[#59645d]">{event.detail}</span>
              </Link>
            ))}
            {selectedNotes.map((note) => (
              <div key={note.id} className="flex items-center gap-2 rounded-xl border border-[#edf2ec] px-3 py-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3a7f35]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#203028]">{note.title}</span>
                  <span className="block text-[11px] text-[#7b877f]">{note.category}</span>
                </span>
                <button type="button" onClick={() => void removeNote(note.id)} className="rounded-md px-2 py-1 text-[11px] font-semibold text-[#9ba69d] hover:bg-rose-50 hover:text-rose-600">
                  Delete
                </button>
              </div>
            ))}
            {selectedEvents.length === 0 && selectedNotes.length === 0 && <p className="text-sm text-[#7b877f]">Nothing on this day.</p>}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void addNote();
              }}
              placeholder="Add a note for this day..."
              className="min-w-0 flex-1 rounded-lg border border-[#edf2ec] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            />
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Note category" className="w-24 rounded-lg border border-[#edf2ec] bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]">
              {CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button type="button" onClick={() => void addNote()} className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">
              Add
            </button>
          </div>
          {noteError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {noteError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
