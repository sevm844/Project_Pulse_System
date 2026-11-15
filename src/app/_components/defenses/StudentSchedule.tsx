"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../_lib/api";
import { DEFENSE_TYPES, formatTime, type ApiScheduleRow } from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";
import DashboardCard from "../DashboardCard";

const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });

// The whole defense schedule of the student's adviser, to read: every group, every date, room and panel. The student's own group is
// marked. It is the same schedule the adviser wrote on the schedule sheet; nothing here can be changed, and no results are shown.
export default function StudentSchedule() {
  const [rows, setRows] = useState<ApiScheduleRow[] | null>(null);
  const [type, setType] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<ApiScheduleRow[]>("/defenses/schedule")
      .then(setRows)
      .catch((err) => setError(errorMessage(err, "Unable to load the defense schedule.")));
  }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => type === "All" || r.defense_type === type), [rows, type]);
  const days = useMemo(() => {
    const byDay = new Map<string, ApiScheduleRow[]>();
    for (const row of shown) byDay.set(row.defense_date, [...(byDay.get(row.defense_date) ?? []), row]);

    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [shown]);

  async function download() {
    const { downloadSchedulePdf } = await import("../../_lib/manuscriptExport/schedule");

    await downloadSchedulePdf(
      shown.map((r) => ({
        date: r.defense_date,
        time: r.defense_time,
        end: r.end_time,
        group: r.group_name,
        course: `${r.course} ${r.section}`,
        type: r.defense_type,
        venue: r.venue ?? "",
        panel: r.panel.map((m) => `${m.name ?? "Panelist"}${m.role === "Chair" ? " (Chair)" : ""}`).join(", "),
      })),
      type === "All" ? "Defense schedule" : `${type} schedule`,
      "University of Batangas, College of Information and Communications Technology.",
      type === "All" ? "Defense schedule" : `${type} schedule`,
    );
  }

  return (
    <DashboardCard className="mt-8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#203028]">Defense schedule</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#7b877f]">The complete schedule from your adviser, for every group. Your group is highlighted.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label="Show defense"
            className="h-9 rounded-lg border border-[#dfe8df] bg-white px-2.5 text-xs text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            <option value="All">All defenses</option>
            {DEFENSE_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          {shown.length > 0 && (
            <button type="button" onClick={() => void download()} className="h-9 rounded-lg border border-[#dfe8df] bg-white px-4 text-xs font-semibold hover:bg-[#f3f7f1]">
              Download PDF
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}
      {rows === null && !error && <p className="mt-6 text-sm text-[#7b877f]">Loading...</p>}

      {rows !== null && shown.length === 0 && (
        <p className="mt-5 rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
          {rows.length === 0 ? "Your adviser has not scheduled any defense yet. It will appear here." : "No defense of this kind is scheduled."}
        </p>
      )}

      <div className="mt-5 space-y-6">
        {days.map(([date, list]) => (
          <section key={date} aria-label={dayLabel(date)}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#203028]">
              <span className="h-5 w-1 rounded-full bg-[#4f8f58]" aria-hidden />
              {dayLabel(date)}
              <span className="text-xs font-normal text-[#9aa59e]">
                {list.length} defense{list.length === 1 ? "" : "s"}
              </span>
            </h3>

            <ul className="mt-2 divide-y divide-[#edf2ec] overflow-hidden rounded-xl border border-[#edf2ec]">
              {list.map((row) => (
                <li key={row.defense_id} className={`grid gap-1 px-4 py-3 sm:grid-cols-[9.5rem_1fr_auto] sm:gap-4 ${row.mine ? "bg-[#f2fbef]" : "bg-white"}`}>
                  <p className="text-sm font-semibold text-[#203028]">
                    {formatTime(row.defense_time)} <span className="font-normal text-[#9aa59e]">to</span> {formatTime(row.end_time)}
                  </p>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#203028]">
                      {row.group_name}
                      <span className="ml-2 text-xs font-normal text-[#7b877f]">
                        {row.course} {row.section}
                      </span>
                      {row.mine && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[#123f2b]">Your group</span>}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-[#59645d]">
                      {row.venue}
                      {row.panel.length > 0 && (
                        <>
                          {" · "}
                          <span className="font-semibold text-[#203028]">Panel: </span>
                          {row.panel.map((m) => `${m.name ?? "Panelist"}${m.role === "Chair" ? " (Chair)" : ""}`).join(", ")}
                        </>
                      )}
                    </p>
                  </div>

                  <p className="flex items-start gap-2 text-xs text-[#59645d] sm:justify-end">
                    <span className="font-semibold">{row.defense_type}</span>
                    {row.status === "Done" && <span className="py-1 text-[#9aa59e]">Done</span>}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DashboardCard>
  );
}
