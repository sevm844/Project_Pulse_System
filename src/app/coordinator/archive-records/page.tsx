"use client";

import { useCallback, useEffect, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";
import OutputList from "../../_components/records/OutputList";
import { apiFetch } from "../../_lib/api";
import { downloadCsv, fetchFinalRecords, matchesSearch, type ApiFinalRecord } from "../../_lib/finalOutputs";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

export default function ArchiveRecordsPage() {
  const [records, setRecords] = useState<ApiFinalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const rows = await fetchFinalRecords(true);
      setRecords(rows.sort((a, b) => (b.archived_at ?? "").localeCompare(a.archived_at ?? "")));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the archive."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function restore(record: ApiFinalRecord) {
    if (!window.confirm(`Restore ${record.group_name} to the active records?`)) return;

    try {
      await apiFetch(`/projects/${record.project_id}/archive`, { method: "DELETE" });
      setNotice(`${record.group_name} was restored to Group Folders.`);
      setOpenId(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to restore the project."));
    }
  }

  function exportCsv() {
    downloadCsv("archive-records.csv", [
      ["Group", "Course", "Section", "School year", "Title", "Adviser", "Archived on", "Archived by", "Remarks"],
      ...visible.map((record) => [
        record.group_name,
        record.course,
        record.section,
        record.school_year,
        record.project_title,
        record.adviser,
        record.archived_at ? formatDate(record.archived_at) : null,
        record.archived_by,
        record.archive_remarks,
      ]),
    ]);
  }

  const visible = records.filter((record) => matchesSearch(record, query));

  return (
    <CoordinatorShell title="Archive Records">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-6 text-[#7b877f]">
            Finished projects whose final outputs were all received. Their files stay available here.
          </p>

          <div className="flex gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search group, title or adviser"
              aria-label="Search the archive"
              className="w-56 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            />
            <button
              type="button"
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1] disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="mt-4 text-sm text-[#2f6f3a]">
            {notice}
          </p>
        )}

        {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

        {!loading && visible.length === 0 && !error && (
          <p className="mt-12 text-center text-sm text-[#9aa59e]">
            {records.length === 0
              ? "Nothing is archived yet. Archive a project from Group Folders once all its outputs are received."
              : "No archived project matches your search."}
          </p>
        )}

        <ul className="mt-6 divide-y divide-[#edf2ec] border-t border-[#edf2ec]">
          {visible.map((record) => {
            const open = openId === record.project_id;

            return (
              <li key={record.project_id}>
                <button
                  type="button"
                  onClick={() => {
                    setNotice("");
                    setOpenId(open ? null : record.project_id);
                  }}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-6 py-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#203028]">
                      {record.project_title ?? record.group_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#7b877f]">
                      {record.group_name} · {record.course} {record.section}
                      {record.school_year ? ` · ${record.school_year}` : ""}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-[#9aa59e]">
                    Archived {record.archived_at ? formatDate(record.archived_at) : ""}
                  </span>
                </button>

                {open && (
                  <div className="space-y-4 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4">
                    <p className="text-xs text-[#7b877f]">
                      {record.adviser ? `Adviser ${record.adviser} · ` : ""}
                      Archived by {record.archived_by ?? "the Coordinator"}
                      {record.archive_remarks ? ` · “${record.archive_remarks}”` : ""}
                    </p>

                    <OutputList outputs={record.outputs} onError={setError} />

                    <div className="border-t border-[#edf2ec] pt-4">
                      <button
                        type="button"
                        onClick={() => void restore(record)}
                        className="text-xs font-semibold text-[#59645d] hover:text-[#203028] hover:underline"
                      >
                        Restore to Group Folders
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </CoordinatorShell>
  );
}
