"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import { apiFetch, type ApiUser } from "../../../_lib/api";
import {
  closeGroup,
  COURSE_OPTIONS,
  errorMessage,
  NO_TITLE_YET,
  type ApiGroup,
} from "../../../_lib/groups";
import { GroupStatusNote, StageBadge } from "../../../_components/ProposalStage";
import TermSelect from "../../../_components/TermSelect";
import { ALL_TERMS, defaultTerm, termLabel, termsOf } from "../../../_lib/terms";

const selectClass =
  "rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none disabled:opacity-60";

export default function DeanGroupsPage() {
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [advisers, setAdvisers] = useState<ApiUser[]>([]);
  const [course, setCourse] = useState("All");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // null = not chosen yet: the list opens on the current school term.
  const [termChoice, setTermChoice] = useState<string | null>(null);
  const [moveFrom, setMoveFrom] = useState("");
  const [moveTo, setMoveTo] = useState("");
  const [confirmingMove, setConfirmingMove] = useState(false);
  const [moving, setMoving] = useState(false);

  const terms = useMemo(() => termsOf(groups), [groups]);
  const term = termChoice ?? defaultTerm(groups);

  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          (course === "All" || group.course === course) && (term === ALL_TERMS || termLabel(group) === term),
      ),
    [course, groups, term],
  );

  // Advisers who hold open groups (a disabled adviser still appears, so their groups can be moved).
  const openByAdviser = useMemo(() => {
    const map = new Map<number, { name: string; count: number }>();

    for (const group of groups) {
      if (group.group_status === "Closed" || !group.adviser) continue;
      const entry = map.get(group.adviser.user_id) ?? { name: group.adviser.name, count: 0 };
      entry.count += 1;
      map.set(group.adviser.user_id, entry);
    }

    return map;
  }, [groups]);
  const moveCount = openByAdviser.get(Number(moveFrom))?.count ?? 0;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [nextGroups, users] = await Promise.all([
        apiFetch<ApiGroup[]>("/groups"),
        apiFetch<ApiUser[]>("/users?status=Active"),
      ]);

      setGroups(nextGroups);
      setAdvisers(users.filter((user) => user.role === "Adviser"));
    } catch (err) {
      setError(errorMessage(err, "Unable to load groups."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  async function confirmClosure(group: ApiGroup) {
    setSavingId(group.group_id);
    setError("");
    setNotice("");

    try {
      const updated = await closeGroup(group.group_id);

      setGroups((current) => current.map((item) => (item.group_id === updated.group_id ? updated : item)));
      setNotice(`${group.group_name}: closed. Its history is kept.`);
    } catch (err) {
      setError(errorMessage(err, "Unable to close this group."));
    }

    setSavingId(null);
  }

  // Moves every open group of one adviser to another in one step.
  async function moveGroups() {
    setMoving(true);
    setError("");
    setNotice("");

    try {
      const result = await apiFetch<{ moved: number }>(`/advisers/${moveFrom}/reassign-groups`, {
        method: "POST",
        body: JSON.stringify({ to_adviser_id: Number(moveTo) }),
      });

      setNotice(`${result.moved} group${result.moved === 1 ? "" : "s"} moved to the new adviser.`);
      setConfirmingMove(false);
      setMoveFrom("");
      setMoveTo("");
      await loadData();
    } catch (err) {
      setError(errorMessage(err, "Unable to move these groups."));
    }

    setMoving(false);
  }

  // Saves one change, then swaps the returned group into the list.
  async function saveChange(group: ApiGroup, path: string, body: object, message: string) {
    setSavingId(group.group_id);
    setError("");
    setNotice("");

    try {
      const updated = await apiFetch<ApiGroup>(`/groups/${group.group_id}/${path}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      setGroups((current) =>
        current.map((item) => (item.group_id === updated.group_id ? updated : item)),
      );
      setNotice(`${group.group_name}: ${message}`);
    } catch (err) {
      setError(errorMessage(err, "Unable to save this change."));
    }

    setSavingId(null);
  }

  return (
    <DeanShell title="Group Management">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Capstone Groups
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Assign advisers and confirm the closing of groups that lost all their
                members. Groups move through their stages by the Adviser and Dean
                actions on each project, not from here.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <TermSelect
                terms={terms}
                value={term}
                onChange={setTermChoice}
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2.5 text-sm outline-none"
              />

              <select
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2.5 text-sm outline-none"
              >
                {["All", ...COURSE_OPTIONS].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {notice}
            </p>
          )}
        </Card>

        {openByAdviser.size > 0 && (
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#203028]">Move an adviser&apos;s groups</h3>
            <p className="mt-1 text-xs text-[#7b877f]">
              When an adviser leaves or goes on leave, move all of their open groups to another adviser in one step. Closed
              groups stay as they are, and work a group already handed in stays with it.
            </p>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold text-[#59645d]">
                From
                <select
                  value={moveFrom}
                  onChange={(event) => {
                    setMoveFrom(event.target.value);
                    setConfirmingMove(false);
                  }}
                  className={`mt-2 block w-56 ${selectClass}`}
                >
                  <option value="">Choose an adviser</option>
                  {[...openByAdviser.entries()].map(([id, entry]) => (
                    <option key={id} value={id}>
                      {entry.name} ({entry.count} open)
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#59645d]">
                To
                <select
                  value={moveTo}
                  onChange={(event) => {
                    setMoveTo(event.target.value);
                    setConfirmingMove(false);
                  }}
                  className={`mt-2 block w-56 ${selectClass}`}
                >
                  <option value="">Choose an adviser</option>
                  {advisers
                    .filter((adviser) => String(adviser.user_id) !== moveFrom)
                    .map((adviser) => (
                      <option key={adviser.user_id} value={adviser.user_id}>
                        {adviser.fname} {adviser.lname}
                      </option>
                    ))}
                </select>
              </label>

              {!confirmingMove ? (
                <button
                  type="button"
                  disabled={!moveFrom || !moveTo}
                  onClick={() => setConfirmingMove(true)}
                  className="rounded-full border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#edf9e9] disabled:opacity-50"
                >
                  Move {moveCount || ""} group{moveCount === 1 ? "" : "s"}
                </button>
              ) : (
                <span className="flex flex-wrap items-center gap-2 text-xs text-[#59645d]">
                  Move {moveCount} open group{moveCount === 1 ? "" : "s"}? The students and both advisers are told.
                  <button
                    type="button"
                    disabled={moving}
                    onClick={() => void moveGroups()}
                    className="rounded-full bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
                  >
                    {moving ? "Moving..." : "Yes, move"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingMove(false)}
                    className="rounded-full border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                  >
                    Cancel
                  </button>
                </span>
              )}
            </div>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course / Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Members</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Adviser</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredGroups.map((group) => {
                  const busy = savingId === group.group_id;

                  return (
                    <tr key={group.group_id}>
                      <td className="px-5 py-4 font-medium text-[#203028]">
                        {group.course} {group.section}
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#203028]">
                        {group.group_name}
                      </td>

                      <td className="px-5 py-4 text-[#59645d]">
                        {group.project?.project_title || NO_TITLE_YET}
                      </td>

                      <td className="px-5 py-4 text-[#59645d]">
                        {group.members.length}
                      </td>

                      <td className="px-5 py-4">
                        {group.project ? <StageBadge stage={group.project.proposal_stage} /> : "-"}
                        <GroupStatusNote status={group.group_status} />
                        {group.group_status === "Pending Closure" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void confirmClosure(group)}
                            className="ml-2 rounded-full border border-[#dfe8df] px-3 py-1 text-[11px] font-semibold text-[#203028] hover:bg-[#edf9e9] disabled:opacity-60"
                          >
                            Confirm closure
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={group.adviser?.user_id ?? ""}
                          disabled={busy}
                          onChange={(event) => {
                            const adviser = advisers.find(
                              (item) => String(item.user_id) === event.target.value,
                            );
                            if (!adviser) return;

                            void saveChange(
                              group,
                              "adviser",
                              { adviser_id: adviser.user_id },
                              `adviser changed to ${adviser.fname} ${adviser.lname}.`,
                            );
                          }}
                          className={`w-48 ${selectClass}`}
                        >
                          {!group.adviser && <option value="">Unassigned</option>}
                          {group.adviser &&
                            !advisers.some((item) => item.user_id === group.adviser?.user_id) && (
                              <option value={group.adviser.user_id}>{group.adviser.name}</option>
                            )}
                          {advisers.map((adviser) => (
                            <option key={adviser.user_id} value={adviser.user_id}>
                              {adviser.fname} {adviser.lname}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}

                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#7b877f]">
                      {loading
                        ? "Loading groups..."
                        : "No groups found. Groups are created by advisers."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DeanShell>
  );
}
