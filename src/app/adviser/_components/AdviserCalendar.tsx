"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarNote = {
  id: number;
  date: string;
  title: string;
  category: string;
};

const STORAGE_KEY = "project-pulse-adviser-calendar-notes";

const categories = ["Reviews", "Consultations", "Defense"];

const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
    };
  });
}

export default function AdviserCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);

  useEffect(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEY);
    if (!savedNotes) return;

    const parsedNotes = JSON.parse(savedNotes) as CalendarNote[];
    if (Array.isArray(parsedNotes)) setNotes(parsedNotes);
  }, []);

  function saveNotes(nextNotes: CalendarNote[]) {
    setNotes(nextNotes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
  }

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  const selectedDateNotes = notes.filter((note) => note.date === selectedDate);
  const datesWithNotes = new Set(notes.map((note) => note.date));

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
  }

  function removeNote(id: number) {
    saveNotes(notes.filter((note) => note.id !== id));
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-[0_1px_2px_rgba(31,42,36,0.04)]">
      <div className="flex items-center justify-between border-b border-[#edf2ec] px-5 py-4">
        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe8df] bg-white text-lg text-[#203028] shadow-sm hover:bg-[#f3f7f1]"
        >
          ‹
        </button>

        <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
          {getMonthLabel(currentMonth)}
        </h2>

        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe8df] bg-white text-lg text-[#203028] shadow-sm hover:bg-[#f3f7f1]"
        >
          ›
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

      <CalendarNotes
        title="Adviser Calendar"
        selectedDate={selectedDate}
        notes={selectedDateNotes}
        noteTitle={noteTitle}
        category={category}
        categories={categories}
        onNoteChange={setNoteTitle}
        onCategoryChange={setCategory}
        onAdd={addNote}
        onRemove={removeNote}
      />
    </aside>
  );
}

function CalendarNotes({
  title,
  selectedDate,
  notes,
  noteTitle,
  category,
  categories,
  onNoteChange,
  onCategoryChange,
  onAdd,
  onRemove,
}: {
  title: string;
  selectedDate: string;
  notes: CalendarNote[];
  noteTitle: string;
  category: string;
  categories: string[];
  onNoteChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="border-t border-[#edf2ec] bg-[#fbfdfb] px-5 py-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#203028]">{title}</h3>
        <p className="mt-1 text-xs text-[#7b877f]">
          {new Date(selectedDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="rounded-2xl border border-[#dfe8df] bg-white p-3">
        <input
          value={noteTitle}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
          }}
          placeholder="Add note..."
          className="w-full rounded-xl border border-[#edf2ec] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
        />

        <div className="mt-3 flex gap-2">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-[#edf2ec] bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-5 text-center text-sm text-[#7b877f]">
            No notes for this date.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#203028]">
                  {note.title}
                </p>
                <p className="mt-0.5 text-xs text-[#7b877f]">{note.category}</p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(note.id)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-[#9ba69d] hover:bg-rose-50 hover:text-rose-600"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
