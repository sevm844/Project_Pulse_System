"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { formatTime, type ApiPanelist } from "../../_lib/defenses";
import { availableEnds, availableStarts, endTime, toMinutes, type BusySlot, type SheetRow, type TimeWindow } from "../../_lib/scheduleSheet";

// One line of the schedule sheet: a group (new schedule) or a defense that already exists (scheduled), with everything that can be edited.
export type SheetRowModel = SheetRow & {
  projectId: number | null;
  course: string;
  section: string;
  include: boolean; // ticked rows are the ones that get saved
  locked: string | null; // why this group cannot be scheduled yet; the row is greyed out
  chair: number | null;
};

export type Column = "date" | "time" | "venue";

const DAY_COLORS = ["#4f8f58", "#d9a21b", "#3b82a6", "#a259a6", "#d4693f", "#6b7f2a"];

const cell =
  "h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-xs text-[#203028] outline-none transition hover:border-[#dfe8df] hover:bg-white focus:border-[#123f2b] focus:bg-white focus:ring-2 focus:ring-[#d7f7d8] disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  mode: "new" | "scheduled";
  rows: SheetRowModel[];
  panelists: ApiPanelist[];
  issues: Map<string, string[]>; // double booking and past dates (worked out while typing)
  serverIssues: Record<string, string[]>; // what the server refused
  dirty?: Set<string>; // scheduled rows that were changed
  onChange: (key: string, patch: Partial<SheetRowModel>) => void;
  onMove?: (index: number, direction: -1 | 1) => void;
  onPaste: (index: number, column: Column, text: string) => void;
  onFillDown: (column: "venue" | "panel") => void;
  peers: SheetRow[]; // the rows being scheduled, so a group is only offered the time that is left
  busy: BusySlot[];
  hours: TimeWindow;
  /** Alpha, Beta and Omega have no panel: the Dean alone decides on the Capstone Monitoring Form. */
  noPanel?: boolean;
  onSelectAll?: (checked: boolean) => void;
  onCancel?: (row: SheetRowModel) => void;
};

export default function SheetGrid({ mode, rows, panelists, issues, serverIssues, dirty, peers, busy, hours, noPanel = false, onChange, onMove, onPaste, onFillDown, onSelectAll, onCancel }: Props) {
  const dates = [...new Set(rows.filter((r) => r.date).map((r) => r.date))].sort();
  const colorOf = (date: string) => DAY_COLORS[dates.indexOf(date) % DAY_COLORS.length];
  const editable = rows.filter((r) => !r.locked);
  const allTicked = editable.length > 0 && editable.every((r) => r.include);

  // Enter moves down the column like a spreadsheet (Shift+Enter moves up).
  function moveWithEnter(event: KeyboardEvent<HTMLElement>, column: string, index: number) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const next = document.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-cell="${column}-${index + (event.shiftKey ? -1 : 1)}"]:not(:disabled)`);
    next?.focus();
    if (next instanceof HTMLInputElement) next.select();
  }

  const fillHeader = (label: string, column: "venue" | "panel") => (
    <span className="inline-flex items-center gap-1">
      {label}
      <button
        type="button"
        onClick={() => onFillDown(column)}
        title={`Copy the first row's ${label.toLowerCase()} to every row below`}
        aria-label={`Fill down ${label.toLowerCase()}`}
        className="rounded border border-[#dfe8df] bg-white px-1 text-[10px] font-semibold text-[#4f8f58] hover:bg-[#edf9e9]"
      >
        ↓
      </button>
    </span>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
        <thead>
          <tr className="sticky top-0 z-10 bg-[#f3f7f1] text-[11px] font-semibold uppercase tracking-wide text-[#59645d]">
            {mode === "new" && (
              <th className="w-8 px-2 py-2.5">
                <input type="checkbox" aria-label="Select every group" checked={allTicked} onChange={(event) => onSelectAll?.(event.target.checked)} />
              </th>
            )}
            <th className="w-12 px-2 py-2.5">#</th>
            <th className="min-w-36 px-2 py-2.5">Group</th>
            <th className="w-[8.25rem] px-2 py-2.5">Date</th>
            <th className="w-[7rem] px-2 py-2.5">Start</th>
            <th className="w-[7rem] px-2 py-2.5">End</th>
            <th className="w-16 px-2 py-2.5">Length</th>
            <th className="min-w-[9.5rem] px-2 py-2.5">{fillHeader("Venue", "venue")}</th>
            {!noPanel && <th className="min-w-[12rem] px-2 py-2.5">{fillHeader("Panel", "panel")}</th>}
            <th className="min-w-[13rem] px-2 py-2.5">Notes</th>
            {mode === "scheduled" && <th className="w-20 px-2 py-2.5" />}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#edf2ec] bg-white">
          {rows.map((row, index) => {
            const conflict = issues.get(row.key) ?? [];
            const refused = serverIssues[row.key] ?? [];
            const problems = [...conflict, ...refused.filter((m) => !conflict.includes(m))];
            const off = Boolean(row.locked) || (mode === "new" && !row.include);
            const missing = !off && (!row.date || !row.time || !row.venue.trim() || (!noPanel && row.panel.length === 0));
            const changed = dirty?.has(row.key);

            return (
              <tr key={row.key} className={`${row.locked ? "bg-[#fafbfa] text-[#9aa59e]" : "hover:bg-[#fbfdfb]"} ${changed ? "bg-[#fffdf3]" : ""}`}>
                {mode === "new" && (
                  <td className="px-2 py-1.5 align-top">
                    <input
                      type="checkbox"
                      aria-label={`Schedule ${row.groupName}`}
                      disabled={Boolean(row.locked)}
                      checked={row.include && !row.locked}
                      onChange={(event) => onChange(row.key, { include: event.target.checked })}
                      className="mt-2"
                    />
                  </td>
                )}

                <td className="px-2 py-1.5 align-top">
                  <div className="flex items-center gap-1 pt-1.5 text-[#7b877f]">
                    <span className="w-4 text-right">{index + 1}</span>
                    {mode === "new" && onMove && !row.locked && (
                      <span className="flex flex-col leading-none">
                        <button type="button" aria-label={`Move ${row.groupName} up`} disabled={index === 0} onClick={() => onMove(index, -1)} className="px-0.5 text-[9px] hover:text-[#123f2b] disabled:opacity-25">
                          ▲
                        </button>
                        <button type="button" aria-label={`Move ${row.groupName} down`} disabled={index === rows.length - 1} onClick={() => onMove(index, 1)} className="px-0.5 text-[9px] hover:text-[#123f2b] disabled:opacity-25">
                          ▼
                        </button>
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-2 py-1.5 align-top">
                  <p className="pt-1.5 text-sm font-semibold text-[#203028]">{row.groupName}</p>
                  <p className="text-[11px] text-[#7b877f]">
                    {row.course} {row.section}
                  </p>
                </td>

                <td className="px-1 py-1.5 align-top">
                  <div className="relative">
                    {row.date && !off && <span aria-hidden className="absolute left-0 top-1 h-6 w-1 rounded-full" style={{ background: colorOf(row.date) }} />}
                    <input
                      type="date"
                      aria-label={`${row.groupName} date`}
                      data-cell={`date-${index}`}
                      disabled={off}
                      value={row.date}
                      onChange={(event) => onChange(row.key, { date: event.target.value })}
                      onKeyDown={(event) => moveWithEnter(event, "date", index)}
                      onPaste={(event) => {
                        const text = event.clipboardData.getData("text");
                        // A date box cannot take pasted text by itself, so every paste is read here.
                        if (text.trim()) {
                          event.preventDefault();
                          onPaste(index, "date", text);
                        }
                      }}
                      className={`${cell} ${row.date ? "pl-3" : ""}`}
                    />
                  </div>
                </td>

                {/* Start and end are picked from the time that is still free; the length follows from them. */}
                <td className="px-1 py-1.5 align-top">
                  <TimePick
                    label={`${row.groupName} start time`}
                    cellId={`time-${index}`}
                    disabled={off}
                    value={row.time}
                    options={off ? [] : availableStarts(row, peers, busy, hours)}
                    placeholder="Start"
                    onPick={(time) => {
                      // Keep the same length when it still fits; otherwise take the longest that does.
                      const ends = availableEnds(row, time, peers, busy, hours);
                      const wanted = endTime(time, row.minutes || hours.step);
                      const end = ends.includes(wanted) ? wanted : (ends[ends.length - 1] ?? wanted);
                      onChange(row.key, { time, minutes: toMinutes(end) - toMinutes(time) });
                    }}
                    onKeyDown={(event) => moveWithEnter(event, "time", index)}
                    onPaste={(text) => onPaste(index, "time", text)}
                  />
                </td>

                <td className="px-1 py-1.5 align-top">
                  <TimePick
                    label={`${row.groupName} end time`}
                    cellId={`end-${index}`}
                    disabled={off || !row.time}
                    value={row.time ? endTime(row.time, row.minutes) : ""}
                    options={off || !row.time ? [] : availableEnds(row, row.time, peers, busy, hours)}
                    placeholder="End"
                    onPick={(end) => onChange(row.key, { minutes: toMinutes(end) - toMinutes(row.time) })}
                    onKeyDown={(event) => moveWithEnter(event, "end", index)}
                  />
                </td>

                <td className="px-2 py-1.5 align-top text-[#59645d]">
                  <span className="block whitespace-nowrap pt-1.5" aria-label={`${row.groupName} length`}>
                    {row.time && !off && row.minutes > 0 ? `${row.minutes} min` : ""}
                  </span>
                </td>

                <td className="px-1 py-1.5 align-top">
                  <input
                    type="text"
                    maxLength={150}
                    placeholder="Room"
                    aria-label={`${row.groupName} venue`}
                    data-cell={`venue-${index}`}
                    disabled={off}
                    value={row.venue}
                    onChange={(event) => onChange(row.key, { venue: event.target.value })}
                    onKeyDown={(event) => moveWithEnter(event, "venue", index)}
                    onPaste={(event) => {
                      const text = event.clipboardData.getData("text");
                      if (/[\t\n]/.test(text.trim())) {
                        event.preventDefault();
                        onPaste(index, "venue", text);
                      }
                    }}
                    className={cell}
                  />
                </td>

                {!noPanel && (
                  <td className="px-1 py-1.5 align-top">
                    <PanelCell row={row} panelists={panelists} disabled={off} onChange={(panel, chair) => onChange(row.key, { panel, chair })} />
                  </td>
                )}

                <td className="px-2 py-1.5 align-top">
                  <div className="space-y-0.5 pt-1.5">
                    {row.locked && <p className="text-[11px] leading-4 text-[#9aa59e]">{row.locked}</p>}
                    {!off && problems.map((message) => (
                      <p key={message} className="text-[11px] leading-4 text-[#b42318]">
                        {message}
                      </p>
                    ))}
                    {missing && problems.length === 0 && <p className="text-[11px] text-[#b7791f]">Add the {!row.date ? "date" : !row.time ? "start time" : !row.venue.trim() ? "venue" : "panel"}.</p>}
                    {!off && !missing && problems.length === 0 && (
                      <p className="text-[11px] font-semibold text-[#2f6f3a]">{mode === "scheduled" ? (changed ? "Changed, not saved yet" : "Scheduled") : "Ready"}</p>
                    )}
                  </div>
                </td>

                {mode === "scheduled" && (
                  <td className="px-2 py-1.5 text-right align-top">
                    <button type="button" onClick={() => onCancel?.(row)} className="mt-1.5 text-[11px] font-semibold text-[#b42318] hover:underline">
                      Cancel
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Who is on the panel: a button that opens a small list to tick panelists and choose the chair.
function PanelCell({ row, panelists, disabled, onChange }: { row: SheetRowModel; panelists: ApiPanelist[]; disabled: boolean; onChange: (panel: number[], chair: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState({ top: 0, left: 0 });

  // The list is drawn on the page itself (not inside the scrolling table) so the table never cuts it off.
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const rect = button.current.getBoundingClientRect();
    setPlace({ top: Math.min(rect.bottom + 4, window.innerHeight - 300), left: Math.min(rect.left, window.innerWidth - 280) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const clickAway = (event: globalThis.MouseEvent) => {
      if (!popup.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", clickAway);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("mousedown", clickAway);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const nameOf = (id: number) => panelists.find((p) => p.user_id === id)?.name ?? "Panelist";
  const first = row.panel.slice(0, 2).map((id) => `${nameOf(id)}${id === row.chair ? " (Chair)" : ""}`);
  const summary = row.panel.length === 0 ? "Choose panel" : `${first.join(", ")}${row.panel.length > 2 ? ` +${row.panel.length - 2}` : ""}`;

  function toggle(id: number) {
    const panel = row.panel.includes(id) ? row.panel.filter((p) => p !== id) : [...row.panel, id];
    onChange(panel, panel.includes(row.chair ?? -1) ? row.chair : null);
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${row.groupName} panel`}
        onClick={() => setOpen((value) => !value)}
        className={`${cell} truncate text-left ${row.panel.length === 0 ? "text-[#9aa59e]" : ""}`}
        title={row.panel.map(nameOf).join(", ")}
      >
        {summary}
      </button>

      {open &&
        createPortal(
          <div
            ref={popup}
            role="dialog"
            aria-label={`Panel for ${row.groupName}`}
            style={{ top: place.top, left: place.left }}
            className="fixed z-[70] max-h-72 w-64 overflow-auto rounded-xl border border-[#dfe8df] bg-white p-2 shadow-[0_16px_42px_rgba(31,42,36,0.18)]"
          >
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]">Tick the panel, choose the chair</p>
            {panelists.length === 0 && <p className="px-2 py-2 text-xs text-[#7b877f]">No panelists have an account yet.</p>}
            {panelists.map((p) => {
              const on = row.panel.includes(p.user_id);

              return (
                <div key={p.user_id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f3f7f1]">
                  <label className="flex min-w-0 items-center gap-2 text-xs text-[#203028]">
                    <input type="checkbox" checked={on} onChange={() => toggle(p.user_id)} />
                    <span className="truncate">{p.name}</span>
                  </label>
                  <label className={`flex items-center gap-1 text-[11px] ${on ? "text-[#59645d]" : "text-[#c5cdc7]"}`}>
                    <input type="radio" name={`chair-${row.key}`} disabled={!on} checked={row.chair === p.user_id} onChange={() => onChange(row.panel, p.user_id)} />
                    Chair
                  </label>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

// A time chosen from a list of what is still free (like "8:45 AM"). A time that is already in the row but no longer free is kept in
// the list so it stays visible; the notes column tells the adviser it clashes. Pasting a time from a spreadsheet still works.
function TimePick({
  label,
  cellId,
  disabled,
  value,
  options,
  placeholder,
  onPick,
  onKeyDown,
  onPaste,
}: {
  label: string;
  cellId: string;
  disabled: boolean;
  value: string;
  options: string[];
  placeholder: string;
  onPick: (time: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPaste?: (text: string) => void;
}) {
  const list = value && !options.includes(value) ? [value, ...options].sort() : options;

  return (
    <select
      aria-label={label}
      data-cell={cellId}
      disabled={disabled}
      value={value}
      onChange={(event) => onPick(event.target.value)}
      onKeyDown={onKeyDown}
      onPaste={(event) => {
        if (!onPaste) return;
        event.preventDefault();
        onPaste(event.clipboardData.getData("text"));
      }}
      className={`${cell.replace("px-2", "px-1")} cursor-pointer`}
    >
      <option value="">{disabled && !value ? "" : placeholder}</option>
      {list.map((time) => (
        <option key={time} value={time}>
          {formatTime(time)}
        </option>
      ))}
    </select>
  );
}
