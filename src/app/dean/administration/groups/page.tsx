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

  const filteredGroups = useMemo(
    () => (course === "All" ? groups : groups.filter((group) => group.course === course)),
    [course, groups],
  );

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
                  <th className="px-5 py-3 font-medium">Code</th>
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

                      <td className="px-5 py-4 text-xs font-semibold text-[#4f8f58]">
                        {group.group_code}
                      </td>
                    </tr>
                  );
                })}

                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#7b877f]">
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
