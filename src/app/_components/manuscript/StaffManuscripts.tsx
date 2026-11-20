"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ManuscriptHistory from "./ManuscriptHistory";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { type GrammarianManuscript } from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

type Row = GrammarianManuscript;

// The Manuscripts page of the Adviser and the Dean: every group they may read, newest submission first. Groups that have not submitted
// a version yet are tucked away (there is nothing to read) and can be shown. Open a group to read its versions, compare them and comment.
export default function StaffManuscripts({ role }: { role: "Adviser" | "Dean" }) {
  const [groups, setGroups] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showEmpty, setShowEmpty] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setGroups(await apiFetch<Row[]>("/manuscripts"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the manuscripts."));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load, reloadKey]);

  const needle = search.trim().toLowerCase();
  const empty = (groups ?? []).filter((g) => g.versions === 0).length;

  const shown = useMemo(
    () =>
      (groups ?? [])
        .filter((g) => (showEmpty || g.versions > 0) && (!onlyOpen || g.open_comments > 0))
        .filter((g) => `${g.group_name} ${g.course} ${g.section} ${g.adviser ?? ""}`.toLowerCase().includes(needle))
        .sort((a, b) => (b.latest_saved_at ?? "").localeCompare(a.latest_saved_at ?? "") || a.group_name.localeCompare(b.group_name)),
    [groups, showEmpty, onlyOpen, needle],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <p className="max-w-2xl text-sm leading-6 text-[#7b877f]">
        {role === "Adviser"
          ? "The manuscripts your groups have submitted. Open a group to read a version, compare two versions, and comment on the exact words."
          : "The manuscripts submitted by every group. Open a group to read a version, compare two versions, and comment on the exact words."}
      </p>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#edf2ec] pb-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search groups"
          placeholder={role === "Adviser" ? "Search by group, course or section" : "Search by group, course, section or adviser"}
          className="min-w-0 flex-1 rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8] sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-xs text-[#59645d]">
          <input type="checkbox" checked={onlyOpen} onChange={(event) => setOnlyOpen(event.target.checked)} />
          Only groups with open comments
        </label>
        {empty > 0 && (
          <label className="flex items-center gap-2 text-xs text-[#59645d]">
            <input type="checkbox" checked={showEmpty} onChange={(event) => setShowEmpty(event.target.checked)} />
            Also show the {empty} {empty === 1 ? "group" : "groups"} with nothing submitted
          </label>
        )}
        <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="ml-auto text-xs font-semibold text-[#59645d] underline">
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!groups && !error && <p className="text-sm text-[#7b877f]">Loading manuscripts...</p>}

      {groups && shown.length === 0 && !error && (
        <p className="py-10 text-center text-sm text-[#9aa59e]">
          {groups.length === 0
            ? "No groups yet."
            : groups.every((g) => g.versions === 0) && !showEmpty
              ? "No group has submitted a manuscript version yet. A version appears here as soon as a group submits one."
              : "No group matches."}
        </p>
      )}

      <ul className="divide-y divide-[#edf2ec]">
        {shown.map((group) => {
          const open = openId === group.project_id;

          return (
            <li key={group.project_id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#203028]">{group.group_name}</h3>
                  <p className="mt-0.5 text-xs text-[#59645d]">
                    {group.course} {group.section}
                    {role === "Dean" ? ` · Adviser: ${group.adviser ?? "Not assigned"}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {group.versions === 0
                      ? "No version submitted yet"
                      : `${group.versions} ${group.versions === 1 ? "version" : "versions"} · latest is Version ${group.latest_version_no}, ${formatDateTime(group.latest_saved_at)}`}
                    {group.open_comments > 0 && (
                      <span className="ml-2 font-semibold text-amber-700">
                        {group.open_comments} open {group.open_comments === 1 ? "comment" : "comments"}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={group.versions === 0}
                  onClick={() => setOpenId(open ? null : group.project_id)}
                  aria-expanded={open}
                  className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-1.5 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50"
                >
                  {open ? "Hide versions" : "Show versions"}
                </button>
              </div>

              {open && (
                <div className="mt-4 rounded-xl border border-[#edf2ec] bg-white p-4">
                  <ManuscriptHistory projectId={group.project_id} canReview plainDownload reloadKey={reloadKey} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
