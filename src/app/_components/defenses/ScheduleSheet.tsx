"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiFetch } from "../../_lib/api";
import {
  DEFENSE_TYPES,
  todayInManila,
  type ApiDefense,
  type ApiEligibleGroup,
  type ApiPanelist,
  type RowErrors,
} from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";
import { endTime, findIssues, parseDateCell, parseTimeCell, planSchedule, type BusySlot } from "../../_lib/scheduleSheet";
import DashboardCard from "../DashboardCard";
import SheetGrid, { type Column, type SheetRowModel } from "./SheetGrid";

type Role = "Adviser" | "Dean";
type Tab = "new" | "scheduled";

const field =
  "mt-1 h-9 w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 text-xs text-[#203028] outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]";

const DEFAULT_MINUTES = 45;

const signature = (r: SheetRowModel) => JSON.stringify([r.date, r.time, r.minutes, r.venue.trim(), [...r.panel].sort(), r.chair]);

// The page where defenses are scheduled for many groups at once, like a sheet: one row per group, with the times filled in
// automatically and every cell open to editing. The second tab is the same sheet for the defenses that are already scheduled.
export default function ScheduleSheet({ role }: { role: Role }) {
  const back = role === "Adviser" ? "/adviser/defense" : "/dean/defense";
  const today = todayInManila();

  const [type, setType] = useState<string>(DEFENSE_TYPES[0]);
  const [tab, setTab] = useState<Tab>("new");
  const [fillOpen, setFillOpen] = useState(true);
  const latest = useRef(0); // the newest load request
  const touched = useRef(false); // the user has edited the rows on screen
  const [panelists, setPanelists] = useState<ApiPanelist[]>([]);
  const [busy, setBusy] = useState<BusySlot[]>([]);
  const [newRows, setNewRows] = useState<SheetRowModel[]>([]);
  const [schedRows, setSchedRows] = useState<SheetRowModel[]>([]);
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [serverIssues, setServerIssues] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [fill, setFill] = useState({
    startDate: "",
    startTime: "08:00",
    dayEnd: "17:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
    venue: "",
    panel: [] as number[],
    chair: null as number | null,
  });

  // The working day: it limits the times a group can pick from, and it is what the quick fill works inside.
  const hours = useMemo(
    () => ({ start: fill.startTime, end: fill.dayEnd, lunchStart: fill.lunchStart, lunchEnd: fill.lunchEnd, step: 15 }),
    [fill.startTime, fill.dayEnd, fill.lunchStart, fill.lunchEnd],
  );
  const names = useMemo(() => new Map(panelists.map((p) => [p.user_id, p.name])), [panelists]);

  // `quiet` refreshes the rows without blanking the sheet (after a save), so nothing flickers.
  // Only the newest request counts, and an answer that arrives after the user has started typing in the rows never replaces them
  // (React runs effects twice in development, and a slow connection can do the same).
  const reload = useCallback(async (defenseType: string, quiet = false) => {
    const mine = ++latest.current;
    if (!quiet) {
      touched.current = false;
      setLoading(true);
    }

    try {
      const [eligible, defenses, taken] = await Promise.all([
        apiFetch<ApiEligibleGroup[]>(`/defenses/eligible?type=${encodeURIComponent(defenseType)}`),
        apiFetch<ApiDefense[]>("/defenses"),
        apiFetch<BusySlot[]>("/defenses/busy"),
      ]);

      if (mine !== latest.current) return;
      setBusy(taken);

      if (!quiet && touched.current) {
        setLoading(false);
        return;
      }
      touched.current = false;

      setNewRows(
        eligible.map((g) => ({
          key: `p-${g.project_id}`,
          projectId: g.project_id,
          defenseId: null,
          groupName: g.group_name,
          course: g.course,
          section: g.section,
          date: "",
          time: "",
          minutes: DEFAULT_MINUTES,
          venue: "",
          panel: [],
          chair: null,
          include: g.eligible,
          locked: g.reason,
        })),
      );

      const scheduled = defenses
        .filter((d) => d.status === "Scheduled" && d.defense_type === defenseType)
        .map<SheetRowModel>((d) => ({
          key: `d-${d.defense_id}`,
          projectId: d.project_id,
          defenseId: d.defense_id,
          groupName: d.group_name,
          course: d.course,
          section: d.section,
          date: d.defense_date ?? "",
          time: d.defense_time ?? "",
          minutes: d.duration_minutes,
          venue: d.venue ?? "",
          panel: d.panel.map((m) => m.panelist_id),
          chair: d.panel.find((m) => m.role === "Chair")?.panelist_id ?? null,
          include: true,
          locked: null,
        }));

      setSchedRows(scheduled);
      setOriginal(Object.fromEntries(scheduled.map((r) => [r.key, signature(r)])));
      setError("");
    } catch (err) {
      if (mine !== latest.current) return;
      setError(errorMessage(err, "Unable to load the schedule."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      apiFetch<ApiPanelist[]>("/panelists").then(setPanelists).catch((err) => setError(errorMessage(err, "Unable to load the panelists.")));
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => void reload(type));
  }, [type, reload]);

  // Alpha, Beta and Omega have no panel and no score: the Dean alone decides, on the Capstone Monitoring Form.
  const noPanel = type === "Alpha Defense" || type === "Beta Defense" || type === "Omega Defense";
  const rows = tab === "new" ? newRows : schedRows;
  const setRows = tab === "new" ? setNewRows : setSchedRows;
  const active = tab === "new" ? newRows.filter((r) => r.include && !r.locked) : schedRows;
  const dirty = useMemo(() => new Set(schedRows.filter((r) => original[r.key] !== signature(r)).map((r) => r.key)), [schedRows, original]);

  const issues = useMemo(() => findIssues(active, busy, today, names), [active, busy, today, names]);
  const incomplete = active.filter((r) => !r.date || !r.time || !r.venue.trim() || (!noPanel && r.panel.length === 0) || r.minutes < 10 || r.minutes > 480);
  const clashes = active.filter((r) => issues.has(r.key));
  const refused = active.filter((r) => (serverIssues[r.key] ?? []).length > 0);
  const toSave = tab === "new" ? active : active.filter((r) => dirty.has(r.key));
  const days = new Set(active.filter((r) => r.date).map((r) => r.date)).size;
  const canSave = toSave.length > 0 && incomplete.filter((r) => toSave.includes(r)).length === 0 && clashes.filter((r) => toSave.includes(r)).length === 0 && !saving;

  function change(key: string, patch: Partial<SheetRowModel>) {
    touched.current = true;
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setServerIssues((current) => {
      if (!current[key]) return current;
      const { [key]: _gone, ...rest } = current;
      void _gone;

      return rest;
    });
    setNotice("");
  }

  function move(index: number, direction: -1 | 1) {
    touched.current = true;
    setNewRows((current) => {
      const next = [...current];
      const to = index + direction;
      if (to < 0 || to >= next.length) return current;
      [next[index], next[to]] = [next[to], next[index]];

      return next;
    });
  }

  // Pasting several cells copied from Google Sheets or Excel fills downward from the cell that was pasted into.
  function paste(index: number, column: Column, text: string) {
    touched.current = true;
    const lines = text.replace(/\r/g, "").split("\n").filter((line, i, all) => line !== "" || i < all.length - 1);
    const order: Column[] = ["date", "time", "venue"];
    const targets = rows.map((r, i) => ({ r, i })).filter(({ r, i }) => i >= index && !r.locked && (tab !== "new" || r.include));
    let skipped = 0;
    const next = [...rows];

    lines.forEach((line, offset) => {
      const target = targets[offset];
      if (!target) return;
      const patch: Partial<SheetRowModel> = {};

      line.split("\t").forEach((raw, c) => {
        const col = order[order.indexOf(column) + c];
        if (!col) return;
        const value = col === "date" ? parseDateCell(raw) : col === "time" ? parseTimeCell(raw) : raw.trim();
        if (value === null || value === "") {
          if (raw.trim() !== "") skipped += 1;
          return;
        }
        patch[col] = value;
      });

      next[target.i] = { ...next[target.i], ...patch };
    });

    setRows(next);
    setNotice(skipped > 0 ? `${skipped} pasted value${skipped === 1 ? "" : "s"} could not be read as a date or time and ${skipped === 1 ? "was" : "were"} skipped.` : "");
  }

  function fillDown(column: "venue" | "panel") {
    touched.current = true;
    const list = rows.filter((r) => !r.locked && (tab !== "new" || r.include));
    const first = list[0];
    if (!first) return;

    setRows((current) =>
      current.map((r) => {
        if (r.locked || (tab === "new" && !r.include) || r.key === first.key) return r;

        return column === "venue" ? { ...r, venue: first.venue } : { ...r, panel: [...first.panel], chair: first.chair };
      }),
    );
  }

  function autoFill() {
    touched.current = true;
    setError("");
    setNotice("");
    const targets = newRows.filter((r) => r.include && !r.locked);
    if (targets.length === 0) {
      setError("Tick at least one group first.");
      return;
    }
    if (!fill.startDate) {
      setError("Choose the first day.");
      return;
    }

    const { slots, minutes } = planSchedule(targets.length, fill);
    if (slots.length < targets.length) {
      setError("These hours are too short for a defense. Check the start time, the end time and the lunch break.");
      return;
    }

    // Worked out before the state is set: a state update must give the same answer every time it is run.
    const assigned = new Map(targets.map((r, i) => [r.key, slots[i]]));
    setNewRows((current) =>
      current.map((r) => {
        const slot = assigned.get(r.key);
        if (!slot) return r;

        return {
          ...r,
          date: slot.date,
          time: slot.time,
          minutes,
          venue: fill.venue.trim() || r.venue,
          panel: fill.panel.length > 0 ? [...fill.panel] : r.panel,
          chair: fill.panel.length > 0 ? fill.chair : r.chair,
        };
      }),
    );
    setFillOpen(false); // the sheet is what matters now; "Change the times" opens this again
    const dates = [...new Set(slots.map((s) => s.date))];
    setNotice(
      `${targets.length} group${targets.length === 1 ? "" : "s"} filled in: ${minutes} minutes each, ${dates.length === 1 ? "all on the same day" : `over ${dates.length} days`}. ` +
        "Change any start or end you like, then schedule them.",
    );
  }

  function handleRefused(err: unknown, prefix: "p" | "d") {
    const data = err instanceof ApiError ? (err.data as { row_errors?: RowErrors } | undefined) : undefined;

    if (data?.row_errors) {
      setServerIssues(Object.fromEntries(Object.entries(data.row_errors).map(([id, messages]) => [`${prefix}-${id}`, messages])));
      setError("Some rows need fixing (shown in red). Nothing was saved.");
    } else {
      setError(errorMessage(err, "Unable to save."));
    }
  }

  const payload = (r: SheetRowModel) => ({
    defense_date: r.date,
    defense_time: r.time,
    duration_minutes: r.minutes,
    venue: r.venue.trim(),
    panelist_ids: noPanel ? [] : r.panel,
    chair_id: noPanel ? null : r.chair,
  });

  async function scheduleAll() {
    setSaving(true);
    setError("");
    setNotice("");
    setServerIssues({});

    try {
      await apiFetch("/defenses/batch", {
        method: "POST",
        body: JSON.stringify({ defense_type: type, rows: toSave.map((r) => ({ project_id: r.projectId, ...payload(r) })) }),
      });
      const count = toSave.length;
      await reload(type, true);
      setTab("scheduled");
      setNotice(`${count} ${type}${count === 1 ? "" : "s"} scheduled. The groups, their advisers and the panels were told.`);
    } catch (err) {
      handleRefused(err, "p");
    }

    setSaving(false);
  }

  async function saveChanges() {
    setSaving(true);
    setError("");
    setNotice("");
    setServerIssues({});

    try {
      await apiFetch("/defenses/batch", {
        method: "PUT",
        body: JSON.stringify({ rows: toSave.map((r) => ({ defense_id: r.defenseId, ...payload(r) })) }),
      });
      const count = toSave.length;
      await reload(type, true);
      setNotice(`${count} defense${count === 1 ? "" : "s"} updated. The groups and panels were told.`);
    } catch (err) {
      handleRefused(err, "d");
    }

    setSaving(false);
  }

  async function cancelRow(row: SheetRowModel) {
    if (!row.defenseId || !window.confirm(`Cancel the ${type} of ${row.groupName}?`)) return;

    try {
      await apiFetch(`/defenses/${row.defenseId}/cancel`, { method: "PUT" });
      await reload(type, true);
      setNotice(`${row.groupName}: defense cancelled. It can be scheduled again from the first tab.`);
    } catch (err) {
      setError(errorMessage(err, "Unable to cancel."));
    }
  }

  async function printSheet() {
    const { downloadSchedulePdf } = await import("../../_lib/manuscriptExport/schedule");
    const lines = schedRows
      .filter((r) => r.date && r.time)
      .map((r) => ({
        date: r.date,
        time: r.time,
        end: endTime(r.time, r.minutes),
        group: r.groupName,
        course: `${r.course} ${r.section}`,
        type,
        venue: r.venue,
        panel: r.panel.map((id) => `${names.get(id) ?? "Panelist"}${id === r.chair ? " (Chair)" : ""}`).join(", "),
      }));

    await downloadSchedulePdf(lines, `${type} schedule`, `University of Batangas, College of Information and Communications Technology. ${lines.length} group${lines.length === 1 ? "" : "s"}.`, `${type} schedule`);
  }

  const togglePanelist = (id: number) =>
    setFill((current) => {
      const panel = current.panel.includes(id) ? current.panel.filter((p) => p !== id) : [...current.panel, id];

      return { ...current, panel, chair: panel.includes(current.chair ?? -1) ? current.chair : null };
    });

  return (
    <div className="space-y-5">
      <DashboardCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={back} className="text-xs font-semibold text-[#4f8f58] hover:underline">
              ← Back to Defenses
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#203028]">Defense schedule</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#59645d]">
              Schedule every group at once. Let the sheet fill in the times, or pick each group&apos;s start and end yourself: you are only offered the time that is still free, and the length follows from them. You can also paste dates and times copied from Google Sheets or Excel.
            </p>
          </div>

          <label className="block text-xs font-semibold text-[#59645d]">
            Defense
            <select value={type} onChange={(event) => setType(event.target.value)} className={`${field} min-w-48`}>
              {(role === "Adviser" ? DEFENSE_TYPES.slice(0, 1) : DEFENSE_TYPES).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex gap-5 border-b border-[#edf2ec] text-xs font-semibold">
          {(
            [
              ["new", `Schedule groups (${newRows.filter((r) => !r.locked).length})`],
              ["scheduled", `Scheduled (${schedRows.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setError("");
                setNotice("");
              }}
              className={`-mb-px border-b-2 pb-3 ${tab === key ? "border-[#123f2b] text-[#203028]" : "border-transparent text-[#9aa59e] hover:text-[#59645d]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </DashboardCard>

      {tab === "new" && (
        <DashboardCard className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#203028]">Fill in the times for me</h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Pick the first day and your hours. The sheet gives every ticked group its time and chooses the length of each defense and the next days by itself.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={fillOpen}
              onClick={() => setFillOpen((open) => !open)}
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
            >
              {fillOpen ? "Hide" : "Change the times"}
            </button>
          </div>

          <div className={fillOpen ? "" : "hidden"}>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs font-semibold text-[#59645d]">
              First day
              <input type="date" min={today} value={fill.startDate} onChange={(event) => setFill({ ...fill, startDate: event.target.value })} className={field} />
            </label>
            <label className="block text-xs font-semibold text-[#59645d]">
              Start time
              <input type="time" value={fill.startTime} onChange={(event) => setFill({ ...fill, startTime: event.target.value })} className={field} />
            </label>
            <label className="block text-xs font-semibold text-[#59645d]">
              End time
              <input type="time" value={fill.dayEnd} onChange={(event) => setFill({ ...fill, dayEnd: event.target.value })} className={field} />
            </label>
            <label className="block text-xs font-semibold text-[#59645d]">
              Venue
              <input type="text" maxLength={150} placeholder="e.g. CICT Room 101" value={fill.venue} onChange={(event) => setFill({ ...fill, venue: event.target.value })} className={field} />
            </label>
          </div>

          <details className="mt-3 text-xs text-[#59645d]">
            <summary className="cursor-pointer font-semibold hover:text-[#203028]">Lunch break ({fill.lunchStart && fill.lunchEnd ? `${fill.lunchStart} to ${fill.lunchEnd}` : "none"})</summary>
            <div className="mt-2 grid max-w-md grid-cols-2 gap-3">
              <label className="block font-semibold">
                From
                <input type="time" value={fill.lunchStart} onChange={(event) => setFill({ ...fill, lunchStart: event.target.value })} className={field} />
              </label>
              <label className="block font-semibold">
                Until
                <input type="time" value={fill.lunchEnd} onChange={(event) => setFill({ ...fill, lunchEnd: event.target.value })} className={field} />
              </label>
            </div>
          </details>

          {noPanel && <p className="mt-4 text-xs leading-5 text-[#59645d]">The {type} has no panel and no score: only the Dean is there, and his signature on the group&apos;s Capstone Monitoring Form is the result.</p>}
          {!noPanel && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#59645d]">Panel (the same for every group; change a row afterwards if one is different)</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {panelists.map((p) => {
                const on = fill.panel.includes(p.user_id);

                return (
                  <button
                    key={p.user_id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => togglePanelist(p.user_id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-[#4f8f58] bg-[#d7f7d8] text-[#123f2b]" : "border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"}`}
                  >
                    {p.name}
                  </button>
                );
              })}
              {panelists.length === 0 && <span className="text-xs text-[#7b877f]">No panelists have an account yet.</span>}
              {fill.panel.length > 0 && (
                <label className="ml-2 flex items-center gap-2 text-xs font-semibold text-[#59645d]">
                  Chair
                  <select value={fill.chair ?? ""} onChange={(event) => setFill({ ...fill, chair: event.target.value ? Number(event.target.value) : null })} className="h-9 rounded-lg border border-[#dfe8df] bg-white px-2 text-xs">
                    <option value="">None</option>
                    {fill.panel.map((id) => (
                      <option key={id} value={id}>
                        {names.get(id)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
          )}

          <button type="button" onClick={autoFill} className="mt-5 rounded-lg bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]">
            Fill the schedule
          </button>
          </div>
        </DashboardCard>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ec] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">{tab === "new" ? `Groups for the ${type}` : `Scheduled ${type}s`}</h2>
            <p className="mt-0.5 text-xs text-[#7b877f]">
              {tab === "new"
                ? "Untick a group to leave it out. Greyed groups cannot be scheduled yet; the reason is shown."
                : "Change any cell, then press Save changes. Rows you changed are highlighted."}
            </p>
          </div>
          {tab === "scheduled" && schedRows.length > 0 && (
            <button type="button" onClick={() => void printSheet()} className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
              Print / Save as PDF
            </button>
          )}
        </div>

        {loading && <p className="px-5 py-8 text-sm text-[#7b877f]">Loading...</p>}

        {!loading && rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-[#9aa59e]">
            {tab === "new" ? "No groups to schedule yet." : `No ${type} is scheduled yet. Use the first tab to schedule your groups.`}
          </p>
        )}

        {!loading && rows.length > 0 && (
          <SheetGrid
            mode={tab}
            rows={rows}
            panelists={panelists}
            issues={issues}
            serverIssues={serverIssues}
            dirty={dirty}
            onChange={change}
            onMove={tab === "new" ? move : undefined}
            onPaste={paste}
            onFillDown={fillDown}
            peers={active}
            busy={busy}
            hours={hours}
            noPanel={noPanel}
            onSelectAll={(checked) => {
              touched.current = true;
              setNewRows((current) => current.map((r) => (r.locked ? r : { ...r, include: checked })));
            }}
            onCancel={cancelRow}
          />
        )}
      </DashboardCard>

      {rows.length > 0 && !loading && (
        <div className="sticky bottom-0 z-20 -mx-1 rounded-2xl border border-[#dfe8df] bg-white/95 px-5 py-3 shadow-[0_-8px_30px_rgba(31,42,36,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#59645d]" aria-live="polite">
              {tab === "new" ? (
                <>
                  <span className="font-semibold text-[#203028]">{active.length}</span> group{active.length === 1 ? "" : "s"} · {days} day{days === 1 ? "" : "s"} ·{" "}
                  <span className={clashes.length + refused.length > 0 ? "font-semibold text-[#b42318]" : ""}>{clashes.length + refused.length} to fix</span>
                  {incomplete.length > 0 && <> · {incomplete.length} need details</>}
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#203028]">{schedRows.length}</span> scheduled · {dirty.size} changed
                  {clashes.length > 0 && <span className="font-semibold text-[#b42318]"> · {clashes.length} to fix</span>}
                </>
              )}
            </p>

            {tab === "new" ? (
              <button type="button" disabled={!canSave} onClick={() => void scheduleAll()} className="rounded-lg bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40">
                {saving ? "Scheduling..." : `Schedule all (${active.length})`}
              </button>
            ) : (
              <button type="button" disabled={!canSave} onClick={() => void saveChanges()} className="rounded-lg bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40">
                {saving ? "Saving..." : `Save changes (${dirty.size})`}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
