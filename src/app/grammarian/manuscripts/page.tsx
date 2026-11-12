"use client";

import { useEffect, useMemo, useState } from "react";
import GrammarianShell from "../_components/GrammarianShell";
import ManuscriptHistory from "../../_components/manuscript/ManuscriptHistory";
import { errorMessage } from "../../_lib/groups";
import { fetchGrammarianManuscripts, type GrammarianManuscript } from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

// The groups whose manuscript the Grammarian may read: those already in the grammar check. Open one to read its
// submitted versions, compare them and leave grammar comments on the exact words.
export default function GrammarianManuscriptsPage() {
  const [groups, setGroups] = useState<GrammarianManuscript[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchGrammarianManuscripts()
      .then((rows) => !cancelled && setGroups(rows))
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to load the manuscripts.")));

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const shown = useMemo(
    () =>
      (groups ?? [])
        .filter((g) => `${g.group_name} ${g.course} ${g.section} ${g.adviser ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))
        // Newest submission first; groups with nothing submitted yet last.
        .sort((a, b) => (b.latest_saved_at ?? "").localeCompare(a.latest_saved_at ?? "") || a.group_name.localeCompare(b.group_name)),
    [groups, search],
  );

  return (
    <GrammarianShell title="Manuscripts">
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Manuscripts to check</h2>
          <p className="mt-1 text-sm text-[#59645d]">
            These are the groups whose documents the adviser approved for a grammar check. Open a group to read the versions it submitted, compare two of them, and comment on the
            exact words that need fixing. You can resolve your own comments; the group sees them and replies.
          </p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search groups"
            placeholder="Search by group, course, section or adviser"
            className="mt-4 w-full rounded-lg border border-[#dfe8df] px-3 py-2 text-sm sm:max-w-sm"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!groups && !error && <p className="text-sm text-[#7b877f]">Loading manuscripts...</p>}

        {groups && groups.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#cfd9d1] bg-white p-8 text-center text-sm text-[#7b877f]">
            No group is waiting for you yet. A group appears here once its adviser approves a document that needs a grammar check.
          </p>
        )}

        {groups && groups.length > 0 && shown.length === 0 && <p className="text-sm text-[#7b877f]">No group matches your search.</p>}

        <ul className="space-y-4">
          {shown.map((group) => {
            const open = openId === group.project_id;

            return (
              <li key={group.project_id} className="rounded-2xl border border-[#dfe8df] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[#203028]">{group.group_name}</h3>
                    <p className="mt-0.5 text-xs text-[#59645d]">
                      {group.course} {group.section} &middot; Adviser: {group.adviser ?? "Not assigned"}
                    </p>
                    <p className="mt-1 text-xs text-[#7b877f]">
                      {group.versions === 0
                        ? "No version submitted yet"
                        : `${group.versions} ${group.versions === 1 ? "version" : "versions"} · latest is Version ${group.latest_version_no}, ${formatDateTime(group.latest_saved_at)}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.open_comments > 0 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          {group.open_comments} open {group.open_comments === 1 ? "comment" : "comments"}
                        </span>
                      )}
                      {group.my_open_comments > 0 && (
                        <span className="rounded-full bg-[#eef2ee] px-2.5 py-0.5 text-[11px] font-semibold text-[#59645d]">{group.my_open_comments} of them yours</span>
                      )}
                    </div>
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
                  <div className="mt-4 border-t border-[#edf2ec] pt-4">
                    <ManuscriptHistory projectId={group.project_id} canReview reloadKey={reloadKey} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {groups && groups.length > 0 && (
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-xs font-semibold text-[#59645d] underline">
            Refresh the list
          </button>
        )}
      </div>
    </GrammarianShell>
  );
}
