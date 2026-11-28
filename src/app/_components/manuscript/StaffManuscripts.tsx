"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { focusId, readFocus, scrollToFocus } from "../../_lib/focus";
import { describeLastActive } from "./ManuscriptActivity";
import ManuscriptHistory from "./ManuscriptHistory";
import MonitoringForm from "../groups/MonitoringForm";
import RowToggle from "../RowToggle";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { type GrammarianManuscript } from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

type Row = GrammarianManuscript;

// The Manuscripts page of the Adviser and the Dean: every group they may read, newest submission or newest shared document first. A group that
// has neither submitted a version nor shared a document is tucked away (there is nothing to read) and can be shown. Open a group to read
// its versions and the documents it shared with you, compare versions and comment.
const sharedCount = (g: Row) => g.shared_documents ?? 0;
const isEmptyGroup = (g: Row) => g.versions === 0 && sharedCount(g) === 0;
const lastActivity = (g: Row) => [g.latest_saved_at ?? "", g.latest_shared_at ?? ""].sort().pop() ?? "";
export default function StaffManuscripts({ role }: { role: "Adviser" | "Dean" | "Panelist" }) {
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

  // A notice may name one group (?group=2): show it (even a quiet one), open it and scroll to it, once.
  const focusDone = useRef(false);

  useEffect(() => {
    if (groups === null || focusDone.current) return;
    focusDone.current = true;

    const wanted = readFocus().group;
    const target = wanted ? groups.find((item) => item.group_id === wanted) : undefined;

    if (!target) return;

    queueMicrotask(() => {
      setShowEmpty(true);
      setOpenId(target.project_id);
    });
    scrollToFocus(focusId.group(target.group_id));
  }, [groups]);

  const needle = search.trim().toLowerCase();
  const empty = (groups ?? []).filter(isEmptyGroup).length;

  const shown = useMemo(
    () =>
      (groups ?? [])
        .filter((g) => (showEmpty || !isEmptyGroup(g)) && (!onlyOpen || g.open_comments > 0))
        .filter((g) => `${g.group_name} ${g.course} ${g.section} ${g.adviser ?? ""}`.toLowerCase().includes(needle))
        .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)) || a.group_name.localeCompare(b.group_name)),
    [groups, showEmpty, onlyOpen, needle],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <p className="max-w-2xl text-sm leading-6 text-[#7b877f]">
        {role === "Adviser"
          ? "The groups you are the Capstone adviser or the Technical adviser of. Open a group to read the versions it submitted, compare two versions, write your comments and recommendations on the exact words, and see its Capstone Monitoring Form, where you approve each row at least a day before its defense. Otherwise you read and comment only."
          : role === "Panelist"
            ? "The manuscripts of the groups you will panel. Open a group to read the versions it submitted and compare them before the defense."
            : "The manuscripts submitted by every group and the documents they shared with you. Open a group to read a version or a shared document, compare two versions, and comment on the exact words."}
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
            Also show the {empty} {empty === 1 ? "group" : "groups"} with nothing submitted or shared
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
            ? role === "Panelist"
              ? "No group yet. A group appears here once you are put on the panel of its defense."
              : role === "Dean"
                ? "No group yet. The manuscript is your subject from the Alpha stage: a group appears here once it passes its Proposal Defense."
                : "No group yet. A group appears here once its AppDev adviser names you its Capstone or Technical adviser."
            : groups.every(isEmptyGroup) && !showEmpty
              ? "No group has submitted a manuscript version or shared a document yet. They appear here as soon as a group does."
              : "No group matches."}
        </p>
      )}

      <ul className="space-y-4">
        {shown.map((group) => {
          const open = openId === group.project_id;

          return (
            <li id={focusId.group(group.group_id)} key={group.project_id} className="overflow-hidden rounded-xl border border-[#dfe8df] bg-white shadow-[0_6px_18px_rgba(31,42,36,0.05)]">
              <button
                type="button"
                disabled={isEmptyGroup(group) && (group.members ?? []).length === 0}
                onClick={() => setOpenId(open ? null : group.project_id)}
                aria-expanded={open}
                className="group block w-full text-left disabled:opacity-60"
              >
                <div className="bg-[#154530] px-5 py-3">
                  <h3 className="text-sm font-bold text-white">{group.group_name}</h3>
                  <p className="mt-0.5 text-xs text-[#d7f7d8]">
                    {group.course} {group.section}
                    {role === "Dean" ? ` · Adviser: ${group.adviser ?? "Not assigned"}` : ""}
                  </p>
                </div>
                <div className="flex items-start gap-4 px-5 py-4">
                <dl className="grid min-w-0 flex-1 grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
                  <dt className="font-semibold text-[#203028]">Versions</dt>
                  <dd className="text-[#59645d]">
                    {group.versions === 0
                      ? "No version submitted yet"
                      : `${group.versions} ${group.versions === 1 ? "version" : "versions"} · latest is Version ${group.latest_version_no}, ${formatDateTime(group.latest_saved_at)}`}
                  </dd>

                  {(group.latest_decision || group.open_comments > 0) && (
                    <>
                      <dt className="font-semibold text-[#203028]">Review</dt>
                      <dd className="space-y-0.5 font-semibold">
                        {group.latest_decision && (
                          <p className={group.latest_decision === "Approved" ? "text-emerald-700" : "text-amber-700"}>
                            {group.latest_decision === "Approved" ? "Latest version approved" : "Changes requested on the latest version"}
                          </p>
                        )}
                        {group.open_comments > 0 && (
                          <p className="text-amber-700">
                            {group.open_comments} open {group.open_comments === 1 ? "comment" : "comments"}
                          </p>
                        )}
                      </dd>
                    </>
                  )}

                  {sharedCount(group) > 0 && (
                    <>
                      <dt className="font-semibold text-[#203028]">Shared</dt>
                      <dd className="font-semibold text-[#2f6b3c]">
                        {sharedCount(group)} shared {sharedCount(group) === 1 ? "document" : "documents"} · latest edited {formatDateTime(group.latest_shared_at ?? null)}
                      </dd>
                    </>
                  )}

                  {(group.members ?? []).length > 0 && (
                    <>
                      <dt className="font-semibold text-[#203028]">Last typed</dt>
                      <dd className="space-y-0.5 text-[#59645d]">
                        {(group.members ?? []).map((member) => {
                          const last = describeLastActive(member.last_active_at);

                          return (
                            <p key={member.user_id}>
                              {member.name} <span className={last.quiet ? "font-semibold text-amber-700" : ""}>· {last.text}</span>
                            </p>
                          );
                        })}
                      </dd>
                    </>
                  )}
                </dl>
                <div className="pt-0.5">
                  <RowToggle open={open} />
                </div>
                </div>
              </button>

              {open && (
                <div className="border-t border-[#edf2ec] bg-[#fbfdfb] p-5">
                  <ManuscriptHistory
                    projectId={group.project_id}
                    canReview={role !== "Panelist"}
                    canDecide={role === "Dean"}
                    showActivity={role === "Dean"}
                    plainDownload
                    reloadKey={reloadKey}
                  />
                  {role !== "Panelist" && (
                    <div className="mt-6 border-t border-[#edf2ec] pt-4">
                      <h4 className="mb-2 text-sm font-semibold text-[#203028]">Capstone Monitoring Form</h4>
                      <MonitoringForm projectId={group.project_id} role={role === "Dean" ? "Dean" : "Adviser"} />
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
