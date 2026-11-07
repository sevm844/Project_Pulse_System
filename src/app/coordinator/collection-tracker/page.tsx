"use client";

import { useEffect, useMemo, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";
import {
  downloadCsv,
  fetchFinalRecords,
  matchesSearch,
  outputDot,
  type ApiFinalRecord,
} from "../../_lib/finalOutputs";
import { COURSE_OPTIONS, errorMessage } from "../../_lib/groups";

export default function CollectionTrackerPage() {
  const [records, setRecords] = useState<ApiFinalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        setRecords(await fetchFinalRecords(false));
      } catch (err) {
        setError(errorMessage(err, "Unable to load the tracker."));
      }

      setLoading(false);
    }

    void load();
  }, []);

  // One column per final output that exists for any group.
  const columns = useMemo(() => {
    const seen = new Map<number, string>();

    records.forEach((record) =>
      record.outputs.forEach((output) => seen.set(output.requirement_id, output.title)),
    );

    return [...seen.entries()].map(([id, title]) => ({ id, title }));
  }, [records]);

  const visible = records.filter(
    (record) => (course === "All" || record.course === course) && matchesSearch(record, query),
  );

  const slots = visible.reduce((sum, record) => sum + record.total, 0);
  const received = visible.reduce((sum, record) => sum + record.received, 0);
  const complete = visible.filter((record) => record.complete).length;

  function exportCsv() {
    downloadCsv("final-outputs-tracker.csv", [
      ["Group", "Course", "Section", "Adviser", ...columns.map((column) => column.title), "Received"],
      ...visible.map((record) => [
        record.group_name,
        record.course,
        record.section,
        record.adviser,
        ...columns.map((column) => {
          const output = record.outputs.find((item) => item.requirement_id === column.id);

          return output ? output.state : "Not required";
        }),
        `${record.received}/${record.total}`,
      ]),
    ]);
  }

  return (
    <CoordinatorShell title="Collection Tracker">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <p className="text-3xl font-semibold text-[#203028]">{loading ? "–" : complete}</p>
            <p className="mt-1 text-xs text-[#7b877f]">of {visible.length} groups complete</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-[#203028]">{loading ? "–" : received}</p>
            <p className="mt-1 text-xs text-[#7b877f]">of {slots} outputs received</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ec] pb-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search group or adviser"
              aria-label="Search the tracker"
              className="w-56 rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            />
            <select
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              aria-label="Filter by course"
              className="rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs text-[#59645d] outline-none"
            >
              {["All", ...COURSE_OPTIONS].map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All courses" : item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1] disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

        {!loading && columns.length === 0 && !error && (
          <p className="mt-12 text-center text-sm text-[#9aa59e]">
            No final outputs yet. They appear when an adviser or the Dean marks a requirement as a final output.
          </p>
        )}

        {columns.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="text-[#9aa59e]">
                  <th className="py-3 pr-4 font-semibold">Group</th>
                  {columns.map((column) => (
                    <th key={column.id} className="px-2 py-3 text-center font-semibold">
                      {column.title}
                    </th>
                  ))}
                  <th className="py-3 pl-4 text-right font-semibold">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ec]">
                {visible.map((record) => (
                  <tr key={record.project_id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-[#203028]">{record.group_name}</p>
                      <p className="text-[#7b877f]">
                        {record.course} {record.section}
                      </p>
                    </td>

                    {columns.map((column) => {
                      const output = record.outputs.find((item) => item.requirement_id === column.id);

                      return (
                        <td key={column.id} className="px-2 py-3 text-center">
                          {output ? (
                            <span
                              title={`${column.title}: ${output.state}`}
                              className={`inline-block h-2.5 w-2.5 rounded-full ${outputDot[output.state]}`}
                            />
                          ) : (
                            <span className="text-[#c5cdc7]">–</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 pl-4 text-right text-[#59645d]">
                      {record.received}/{record.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {columns.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#7b877f]">
            {(["Missing", "In review", "Needs revision", "Grammar check", "Ready to receive", "Received"] as const).map(
              (state) => (
                <li key={state} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${outputDot[state]}`} />
                  {state}
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </CoordinatorShell>
  );
}
