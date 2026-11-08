"use client";

import { useCallback, useEffect, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";
import OutputList from "../../_components/records/OutputList";
import { apiFetch } from "../../_lib/api";
import { fetchFinalRecords, matchesSearch, type ApiFinalRecord } from "../../_lib/finalOutputs";
import { errorMessage } from "../../_lib/groups";

export default function GroupFoldersPage() {
  const [records, setRecords] = useState<ApiFinalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecords(await fetchFinalRecords(false));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the group folders."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function archive(record: ApiFinalRecord) {
    if (!window.confirm(`Archive ${record.group_name}? You can restore it later from Archive Records.`)) return;

    setBusy(true);

    try {
      await apiFetch(`/projects/${record.project_id}/archive`, { method: "POST", body: JSON.stringify({}) });
      setNotice(`${record.group_name} was archived.`);
      setOpenId(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to archive the project."));
    }

    setBusy(false);
  }

  const visible = records.filter((record) => matchesSearch(record, query));

  return (
    <CoordinatorShell title="Group Folders">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-6 text-[#7b877f]">
            One folder per group with its final outputs. Mark each as received here, then archive the project when the
            folder is complete.
          </p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search group, title or adviser"
            aria-label="Search group folders"
            className="w-64 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          />
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
            {records.length === 0 ? "No groups yet." : "No group matches your search."}
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
                    <p className="truncate text-sm font-semibold text-[#203028]">{record.group_name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#7b877f]">
                      {record.course} {record.section} · {record.project_title ?? "No title chosen yet"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-xs text-[#59645d]">
                    <span>
                      {record.received} of {record.total} received
                    </span>
                    <span className={`h-2 w-2 rounded-full ${record.complete ? "bg-emerald-500" : "bg-[#dfe5e1]"}`} />
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4">
                    <p className="text-xs text-[#7b877f]">
                      {record.adviser ? `Adviser ${record.adviser}` : "No adviser yet"}
                      {record.school_year ? ` · ${record.school_year}` : ""}
                    </p>

                    <OutputList outputs={record.outputs} onReceived={() => void load()} onError={setError} />

                    {record.complete && (
                      <div className="border-t border-[#edf2ec] pt-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void archive(record)}
                          className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
                        >
                          Archive this project
                        </button>
                      </div>
                    )}
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
