"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "../_lib/calendarEvents";
import { errorMessage } from "../_lib/groups";
import { addCalendarNote, fetchCalendarNotes, importCalendarNotes, removeCalendarNote, type CalendarNote } from "../_lib/profile";

type StakeholderCalendarProps = {
  title: string;
  // Where this browser used to keep the notes. They are saved on the server now; what is found here is moved there once.
  storageKey: string;
  categories: readonly string[];
  variant?: "default" | "glass";
  compact?: boolean;
  // Real dates from the backend (defenses, due dates). Personal notes are saved to the account.
  events?: CalendarEvent[];
  eventsLoading?: boolean;
  eventsFailed?: boolean;
};

const eventDot: Record<CalendarEvent["kind"], string> = {
  Defense: "bg-amber-400",
  Due: "bg-[#4f8f58]",
};

const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getCalendarDays(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      key: formatDateKey(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: formatDateKey(date) === formatDateKey(new Date()),
    };
  });
}

// One load at a time per calendar: the notes (and the one-time import of old browser notes) must not run twice when two
// parts of the page ask at once.
const loading = new Map<string, Promise<CalendarNote[]>>();

async function loadNotes(storageKey: string): Promise<CalendarNote[]> {
  try {
    let saved = await fetchCalendarNotes();
    let old: Omit<CalendarNote, "id">[] = [];

    try {
      const raw = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      old = Array.isArray(raw)
        ? raw.filter((n) => n && /^\d{4}-\d{2}-\d{2}$/.test(String(n.date)) && String(n.title ?? "").trim()).slice(0, 200).map((n) => ({
            date: String(n.date), title: String(n.title).trim().slice(0, 200), category: String(n.category ?? "General").slice(0, 40),
          }))
        : [];
    } catch {
      old = [];
    }

    if (saved.length === 0 && old.length > 0) {
      try {
        saved = await importCalendarNotes(old);
        window.localStorage.removeItem(storageKey);
      } catch {
        // they stay in the browser and are tried again next time
      }
    } else if (saved.length > 0 && old.length > 0) {
      window.localStorage.removeItem(storageKey);
    }

    return saved;
  } catch {
    throw new Error("load failed");
  }
}

export default function StakeholderCalendar({
  title,
  storageKey,
  categories,
  variant = "default",
  compact = false,
  events,
  eventsLoading = false,
  eventsFailed = false,
}: StakeholderCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "General");

  const [noteError, setNoteError] = useState("");

  // The notes live on the server, so they follow the person to every device. Notes this browser kept before are sent once.
  useEffect(() => {
    let cancelled = false;
    let pending = loading.get(storageKey);
    if (!pending) {
      pending = loadNotes(storageKey).finally(() => loading.delete(storageKey));
      loading.set(storageKey, pending);
    }

    pending
      .then((saved) => !cancelled && setNotes(saved))
      .catch(() => !cancelled && setNoteError("Your notes could not be loaded. Please refresh the page."));

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  const selectedDateNotes = notes.filter((note) => note.date === selectedDate);
  const datesWithNotes = new Set(notes.map((note) => note.date));
  // Without `events` this is a notes-only calendar.
  const showEvents = events !== undefined;
  const allEvents = useMemo(() => events ?? [], [events]);
  const selectedDateEvents = allEvents.filter((event) => event.date === selectedDate);
  const today = formatDateKey(new Date());
  const comingUp = allEvents.filter((event) => event.date >= today && !event.done).slice(0, 4);

  function kindsOn(dateKey: string) {
    return new Set(allEvents.filter((event) => event.date === dateKey).map((event) => event.kind));
  }

  function showDate(dateKey: string) {
    setSelectedDate(dateKey);
    setCurrentMonth(parseDateKey(dateKey));
  }

  function goToPreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  }

  async function addNote() {
    const cleanTitle = noteTitle.trim();
    if (!cleanTitle) return;
    setNoteError("");

    try {
      const saved = await addCalendarNote({ date: selectedDate, title: cleanTitle, category });
      setNotes((list) => [...list, saved]);
      setNoteTitle("");
      setSelectedDate(formatDateKey(new Date()));
      setCurrentMonth(new Date());
    } catch (err) {
      setNoteError(errorMessage(err, "The note could not be saved. Please try again."));
    }
  }

  async function removeNote(id: number) {
    setNoteError("");

    try {
      await removeCalendarNote(id);
      setNotes((list) => list.filter((note) => note.id !== id));
    } catch (err) {
      setNoteError(errorMessage(err, "The note could not be removed. Please try again."));
    }
  }

  const isGlass = variant === "glass";
  const headerPadding = compact ? "px-4 py-3" : "px-5 py-4";
  const navButtonSize = compact ? "h-8 w-8 rounded-lg text-base" : "h-10 w-10 rounded-xl text-lg";
  const monthTitleSize = compact ? "text-base" : "text-lg";
  const calendarPadding = compact ? "px-4 py-3" : "px-5 py-4";
  const weekDaySize = compact ? "text-[10px]" : "text-xs";
  const dayGridSpacing = compact ? "mt-3 gap-y-1.5 text-xs" : "mt-4 gap-y-2 text-sm";
  const dayButtonSize = compact ? "h-7 w-7" : "h-9 w-9";
  const notesPadding = compact ? "px-4 py-4" : "px-5 py-5";
  const panelTitleSize = compact ? "text-sm" : "text-base";

  return (
    <aside
      className={`overflow-hidden rounded-2xl ${
        isGlass
          ? "border border-white/55 bg-white/24 shadow-[0_22px_60px_rgba(31,42,36,0.08)] backdrop-blur-2xl"
          : "border border-[#dfe8df] bg-white shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b ${headerPadding} ${
          isGlass ? "border-white/45 bg-white/10" : "border-[#edf2ec]"
        }`}
      >
        <button
          type="button"
          onClick={goToPreviousMonth}
          className={`flex ${navButtonSize} items-center justify-center text-[#203028] shadow-sm transition ${
            isGlass
              ? "border border-white/55 bg-white/34 backdrop-blur-xl hover:bg-white/50"
              : "border border-[#dfe8df] bg-white hover:bg-[#f3f7f1]"
          }`}
        >
          {"<"}
        </button>

        <h2 className={`${monthTitleSize} font-semibold tracking-tight text-[#203028]`}>
          {getMonthLabel(currentMonth)}
        </h2>

        <button
          type="button"
          onClick={goToNextMonth}
          className={`flex ${navButtonSize} items-center justify-center text-[#203028] shadow-sm transition ${
            isGlass
              ? "border border-white/55 bg-white/34 backdrop-blur-xl hover:bg-white/50"
              : "border border-[#dfe8df] bg-white hover:bg-[#f3f7f1]"
          }`}
        >
          {">"}
        </button>
      </div>

      <div className={calendarPadding}>
        <div className={`grid grid-cols-7 text-center ${weekDaySize} font-medium text-[#7b877f]`}>
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className={`grid grid-cols-7 text-center ${dayGridSpacing}`}>
          {calendarDays.map((item) => {
            const isSelected = item.key === selectedDate;
            const hasNote = datesWithNotes.has(item.key);
            const kinds = kindsOn(item.key);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedDate(item.key)}
                className={`relative mx-auto flex ${dayButtonSize} items-center justify-center rounded-full transition ${
                  isSelected
                    ? "bg-[#123f2b] font-semibold text-white"
                    : item.isCurrentMonth
                      ? "text-[#203028] hover:bg-[#f3f7f1]"
                      : "text-[#b9c0bb]"
                }`}
              >
                {item.day}

                {!isSelected && (hasNote || kinds.size > 0) && (
                  <span className="absolute bottom-0.5 flex gap-0.5">
                    {[...kinds].map((kind) => (
                      <span key={kind} className={`h-1.5 w-1.5 rounded-full ${eventDot[kind]}`} />
                    ))}
                    {hasNote && <span className="h-1.5 w-1.5 rounded-full bg-[#123f2b]" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`border-t ${notesPadding} ${
          isGlass
            ? "border-white/45 bg-white/12 backdrop-blur-xl"
            : "border-[#edf2ec] bg-[#fbfdfb]"
        }`}
      >
        {showEvents && (
          <div className="mb-5">
            <h3 className={`${panelTitleSize} font-semibold text-[#203028]`}>Coming up</h3>

            {eventsLoading ? (
              <p className="mt-2 text-xs text-[#7b877f]">Loading dates...</p>
            ) : comingUp.length === 0 ? (
              <p className="mt-2 text-xs text-[#7b877f]">
                {eventsFailed ? "Some dates could not be loaded." : "No upcoming dates."}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {comingUp.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => showDate(event.date)}
                      className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#f3f7f1]"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${eventDot[event.kind]}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-[#203028]">
                          {event.title}
                        </span>
                        <span className="block text-[11px] text-[#7b877f]">
                          {event.kind === "Due" ? "Due " : ""}
                          {formatDateLabel(event.date)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex gap-3 text-[10px] text-[#7b877f]">
              <span className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${eventDot.Defense}`} /> Defense
              </span>
              <span className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${eventDot.Due}`} /> Due date
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#123f2b]" /> My note
              </span>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`${panelTitleSize} font-semibold text-[#203028]`}>{title}</h3>
            <p className="mt-1 text-xs text-[#7b877f]">
              {formatDateLabel(selectedDate)}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold text-[#59645d] ${
              isGlass ? "border-white/55 bg-white/34" : "border-[#dfe8df] bg-white"
            }`}
          >
            {selectedDateEvents.length + selectedDateNotes.length} item
            {selectedDateEvents.length + selectedDateNotes.length === 1 ? "" : "s"}
          </span>
        </div>

        <div
          className={`rounded-2xl border p-3 ${
            isGlass
              ? "border-white/55 bg-white/24 backdrop-blur-xl"
              : "border-[#dfe8df] bg-white"
          }`}
        >
          <input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addNote();
            }}
            placeholder="Add note for selected date..."
            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8] ${
              isGlass
                ? "border-white/55 bg-white/34 backdrop-blur"
                : "border-[#edf2ec]"
            }`}
          />

          <div className="mt-3 flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8] ${
                isGlass
                  ? "border-white/55 bg-white/34 backdrop-blur"
                  : "border-[#edf2ec] bg-white"
              }`}
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void addNote()}
              className="rounded-xl bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              Add
            </button>
          </div>
          {noteError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {noteError}
            </p>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {selectedDateEvents.map((event) => (
            <Link
              key={event.id}
              href={event.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_1px_2px_rgba(31,42,36,0.04)] transition hover:bg-[#f3f7f1] ${
                isGlass ? "bg-white/30 backdrop-blur-xl" : "bg-white"
              }`}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${eventDot[event.kind]}`} />
              <span className="min-w-0 flex-1">
                <span
                  className={`block break-words text-sm font-semibold ${
                    event.done ? "text-[#7b877f]" : "text-[#203028]"
                  }`}
                >
                  {event.title}
                </span>
                <span className="mt-0.5 block text-xs text-[#7b877f]">{event.detail}</span>
              </span>
            </Link>
          ))}

          {selectedDateEvents.length === 0 && selectedDateNotes.length === 0 ? (
            <div
              className={`rounded-2xl px-4 py-5 text-center text-sm text-[#7b877f] ${
                isGlass ? "bg-white/24 backdrop-blur-xl" : "bg-white"
              }`}
            >
              Nothing on this date.
            </div>
          ) : (
            selectedDateNotes.map((note) => (
              <div
                key={note.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_1px_2px_rgba(31,42,36,0.04)] ${
                  isGlass ? "bg-white/30 backdrop-blur-xl" : "bg-white"
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md border border-[#bfc9c0]">
                  <div className="h-2.5 w-2.5 rounded-sm bg-[#123f2b]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#203028]">
                    {note.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7b877f]">
                    {note.category}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-[#59645d]">
                    {formatDateLabel(note.date)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void removeNote(note.id)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[#9ba69d] hover:bg-rose-50 hover:text-rose-600"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
