"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { todayInManila } from "../../_lib/defenses";

type Cell = { added: number; removed: number; minutes: number };
type Member = { user_id: number; name: string; is_member: boolean; added: number; removed: number; minutes: number; days_active: number; last_active_at: string | null };
type Day = { date: string; cells: Record<string, Cell>; versions: { version_no: number; by: string }[] };
type Activity = { group_name: string; range_days: number; since: string; members: Member[]; days: Day[] };

const RANGES = [7, 14, 30, 90];
// Characters typed -> words: the usual rule of thumb is 5 characters to a word.
export const wordsOf = (characters: number) => Math.round(characters / 5);

const manilaDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const dayNumber = (date: string) => Math.round(new Date(`${date}T00:00:00Z`).getTime() / 86400000);

/** "today", "yesterday", "3 days ago" or "never" for the last time someone typed, and whether that is long enough to look into (3 days or more). */
export function describeLastActive(iso: string | null): { text: string; quiet: boolean } {
  if (!iso) return { text: "has not typed yet", quiet: true };
  const days = dayNumber(todayInManila()) - dayNumber(manilaDate(iso));
  if (days <= 0) return { text: "today", quiet: false };
  if (days === 1) return { text: "yesterday", quiet: false };

  return { text: `${days} days ago`, quiet: days >= 3 };
}

const dayLabel = (date: string) => {
  const today = todayInManila();
  if (date === today) return "Today";
  if (dayNumber(today) - dayNumber(date) === 1) return "Yesterday";

  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Manila" });
};

const selectClass = "rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs text-[#59645d] outline-none focus:ring-2 focus:ring-[#d7f7d8]";

// For the adviser and the Dean: who in the group worked on the manuscript, day by day. Numbers come from what each member typed in the editor.
export default function ManuscriptActivity({ projectId }: { projectId: number }) {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<Activity | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch<Activity>(`/projects/${projectId}/manuscript/activity?days=${days}`)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to load the activity.")));

    return () => {
      cancelled = true;
    };
  }, [projectId, days]);

  // The longest day of typing in the range: the bars are drawn against it.
  const biggest = useMemo(
    () => Math.max(1, ...(data?.days ?? []).flatMap((day) => Object.values(day.cells).map((cell) => cell.added))),
    [data],
  );

  // Days with nobody working are folded into one line so a 90-day view stays readable.
  const rows = useMemo(() => {
    const out: ({ kind: "day"; day: Day } | { kind: "quiet"; from: string; to: string; count: number })[] = [];

    for (const day of data?.days ?? []) {
      const worked = Object.keys(day.cells).length > 0 || day.versions.length > 0;
      const previous = out[out.length - 1];

      if (worked) out.push({ kind: "day", day });
      else if (previous?.kind === "quiet") {
        previous.to = day.date;
        previous.count += 1;
      } else out.push({ kind: "quiet", from: day.date, to: day.date, count: 1 });
    }

    return out;
  }, [data]);

  return (
    <section aria-label="Daily activity" className="mb-5 rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#203028]">Daily activity</h4>
          <p className="mt-0.5 text-xs text-[#7b877f]">Who typed in the manuscript, and when.</p>
        </div>
        <select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Days to show" className={selectClass}>
          {RANGES.map((range) => (
            <option key={range} value={range}>
              Last {range} days
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {error}
        </p>
      )}
      {!data && !error && <p className="mt-3 text-xs text-[#7b877f]">Loading...</p>}

      {data && (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="text-[#7b877f]">
                <tr>
                  <th className="pb-2 pr-3 font-semibold">Member</th>
                  <th className="pb-2 pr-3 font-semibold">Days worked</th>
                  <th className="pb-2 pr-3 font-semibold">Typed (about)</th>
                  <th className="pb-2 pr-3 font-semibold">Minutes typing</th>
                  <th className="pb-2 font-semibold">Last typed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ec]">
                {data.members.map((member) => {
                  const last = describeLastActive(member.last_active_at);

                  return (
                    <tr key={member.user_id}>
                      <td className="py-2 pr-3 font-semibold text-[#203028]">
                        {member.name}
                        {!member.is_member && <span className="ml-1 font-normal text-[#9aa59e]">(left the group)</span>}
                      </td>
                      <td className="py-2 pr-3 text-[#59645d]">
                        {member.days_active} of {data.range_days}
                      </td>
                      <td className="py-2 pr-3 text-[#59645d]">{wordsOf(member.added).toLocaleString("en-PH")} words</td>
                      <td className="py-2 pr-3 text-[#59645d]">{member.minutes.toLocaleString("en-PH")} min</td>
                      <td className={`py-2 font-semibold ${last.quiet && member.is_member ? "text-amber-700" : "text-[#59645d]"}`}>{last.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3">
            {rows.map((row) =>
              row.kind === "quiet" ? (
                <li key={`q-${row.from}`} className="text-xs text-[#9aa59e]">
                  {row.count === 1 ? dayLabel(row.from) : `${dayLabel(row.to)} to ${dayLabel(row.from)}`}: nobody worked ({row.count} {row.count === 1 ? "day" : "days"})
                </li>
              ) : (
                <li key={row.day.date}>
                  <p className="text-xs font-semibold text-[#203028]">{dayLabel(row.day.date)}</p>
                  <ul className="mt-1 space-y-1">
                    {data.members
                      .filter((member) => row.day.cells[member.user_id])
                      .map((member) => {
                        const cell = row.day.cells[member.user_id];

                        return (
                          <li key={member.user_id} className="flex items-center gap-3 text-xs text-[#59645d]">
                            <span className="w-36 shrink-0 truncate">{member.name}</span>
                            <span className="h-2 flex-1 overflow-hidden rounded bg-[#edf2ec]" aria-hidden>
                              <span className="block h-full rounded bg-[#4f8f58]" style={{ width: `${Math.max(2, Math.round((cell.added / biggest) * 100))}%` }} />
                            </span>
                            <span className="w-44 shrink-0 text-right">
                              {wordsOf(cell.added).toLocaleString("en-PH")} words{cell.minutes > 0 ? ` · ${cell.minutes} min` : ""}
                            </span>
                          </li>
                        );
                      })}
                    {row.day.versions.map((version) => (
                      <li key={version.version_no} className="text-xs font-semibold text-[#123f2b]">
                        Version {version.version_no} submitted by {version.by}
                      </li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>

          <p className="mt-4 text-[11px] leading-4 text-[#9aa59e]">
            Counted from what each member types in the manuscript, in Manila time. Words are estimated from the characters typed. Typing before this view was added is not shown.
          </p>
        </>
      )}
    </section>
  );
}
