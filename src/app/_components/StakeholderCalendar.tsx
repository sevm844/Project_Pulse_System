"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarNote = {
  id: number;
  date: string;
  title: string;
  category: string;
};

type StakeholderCalendarProps = {
  title: string;
  storageKey: string;
  categories: readonly string[];
  variant?: "default" | "glass";
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

export default function StakeholderCalendar({
  title,
  storageKey,
  categories,
  variant = "default",
}: StakeholderCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "General");

  useEffect(() => {
    const savedNotes = localStorage.getItem(storageKey);
    if (!savedNotes) return;

    const parsedNotes = JSON.parse(savedNotes) as CalendarNote[];
    if (!Array.isArray(parsedNotes)) return;

    queueMicrotask(() => setNotes(parsedNotes));
  }, [storageKey]);

  function saveNotes(nextNotes: CalendarNote[]) {
    setNotes(nextNotes);
    localStorage.setItem(storageKey, JSON.stringify(nextNotes));
  }

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  const selectedDateNotes = notes.filter((note) => note.date === selectedDate);
  const datesWithNotes = new Set(notes.map((note) => note.date));

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

  function addNote() {
    const cleanTitle = noteTitle.trim();
    if (!cleanTitle) return;

    saveNotes([
      ...notes,
      {
        id: Date.now(),
        date: selectedDate,
        title: cleanTitle,
        category,
      },
    ]);
    setNoteTitle("");
    setSelectedDate(formatDateKey(new Date()));
    setCurrentMonth(new Date());
  }

  function removeNote(id: number) {
    saveNotes(notes.filter((note) => note.id !== id));
  }

  const isGlass = variant === "glass";

  return (
    <aside
      className={`overflow-hidden rounded-2xl ${
        isGlass
          ? "border border-white/55 bg-white/24 shadow-[0_22px_60px_rgba(31,42,36,0.08)] backdrop-blur-2xl"
          : "border border-[#dfe8df] bg-white shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-5 py-4 ${
          isGlass ? "border-white/45 bg-white/10" : "border-[#edf2ec]"
        }`}
      >
        <button
          type="button"
          onClick={goToPreviousMonth}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg text-[#203028] shadow-sm transition ${
            isGlass
              ? "border border-white/55 bg-white/34 backdrop-blur-xl hover:bg-white/50"
              : "border border-[#dfe8df] bg-white hover:bg-[#f3f7f1]"
          }`}
        >
          {"<"}
        </button>

        <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
          {getMonthLabel(currentMonth)}
        </h2>

        <button
          type="button"
          onClick={goToNextMonth}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg text-[#203028] shadow-sm transition ${
            isGlass
              ? "border border-white/55 bg-white/34 backdrop-blur-xl hover:bg-white/50"
              : "border border-[#dfe8df] bg-white hover:bg-[#f3f7f1]"
          }`}
        >
          {">"}
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-7 text-center text-xs font-medium text-[#7b877f]">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-sm">
          {calendarDays.map((item) => {
            const isSelected = item.key === selectedDate;
            const hasNote = datesWithNotes.has(item.key);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedDate(item.key)}
                className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full transition ${
                  isSelected
                    ? "bg-[#202823] font-semibold text-white"
                    : item.isCurrentMonth
                      ? "text-[#203028] hover:bg-[#f3f7f1]"
                      : "text-[#b9c0bb]"
                }`}
              >
                {item.day}

                {hasNote && !isSelected && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[#4f8f58]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`border-t px-5 py-5 ${
          isGlass
            ? "border-white/45 bg-white/12 backdrop-blur-xl"
            : "border-[#edf2ec] bg-[#fbfdfb]"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#203028]">{title}</h3>
            <p className="mt-1 text-xs text-[#7b877f]">
              {formatDateLabel(selectedDate)}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold text-[#59645d] ${
              isGlass ? "border-white/55 bg-white/34" : "border-[#dfe8df] bg-white"
            }`}
          >
            {selectedDateNotes.length} note
            {selectedDateNotes.length === 1 ? "" : "s"}
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
              if (e.key === "Enter") addNote();
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
              onClick={addNote}
              className="rounded-xl bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {selectedDateNotes.length === 0 ? (
            <div
              className={`rounded-2xl px-4 py-5 text-center text-sm text-[#7b877f] ${
                isGlass ? "bg-white/24 backdrop-blur-xl" : "bg-white"
              }`}
            >
              No notes for this date.
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
                  <div className="h-2.5 w-2.5 rounded-sm bg-[#d7f7d8]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#203028]">
                    {note.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7b877f]">
                    {note.category}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-[#59645d]">
                    Due {formatDateLabel(note.date)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
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
