"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import {
  db,
  type CapstoneGroup,
  type CourseCode,
  type UserProfile,
} from "../../../_lib/firebase";
import {
  normalizeProjectStage,
  PROJECT_STAGES,
  type ProjectStage,
} from "../../../_utils/projectWorkflow";

const courses: Array<"All" | CourseCode> = ["All", "BSIT", "BSCS", "BSIS"];

export default function DeanGroupsPage() {
  const [groups, setGroups] = useState<CapstoneGroup[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [loading, setLoading] = useState(true);

  const advisers = users.filter((user) => user.role === "Adviser");
  const panelists = users.filter((user) => user.role === "Panelist");

  const filteredGroups = useMemo(() => {
    if (course === "All") return groups;
    return groups.filter((group) => group.course === course);
  }, [course, groups]);

  async function loadData() {
    setLoading(true);

    const [groupSnapshot, userSnapshot] = await Promise.all([
      getDocs(collection(db, "groups")),
      getDocs(collection(db, "users")),
    ]);

    setGroups(
      groupSnapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<CapstoneGroup, "id">),
        stage: normalizeProjectStage(String(item.data().stage || "")),
      })),
    );

    setUsers(userSnapshot.docs.map((item) => item.data() as UserProfile));
    setLoading(false);
  }

  async function assignAdviser(group: CapstoneGroup, adviserId: string) {
    const adviser = advisers.find((item) => item.uid === adviserId);

    await updateDoc(doc(db, "groups", group.id), {
      adviserId,
      adviserName: adviser?.fullName || "Unassigned",
      updatedAt: new Date().toISOString(),
    });

    setGroups((current) =>
      current.map((item) =>
        item.id === group.id
          ? {
              ...item,
              adviserId,
              adviserName: adviser?.fullName || "Unassigned",
            }
          : item,
      ),
    );
  }

  async function updateStage(group: CapstoneGroup, stage: ProjectStage) {
    await updateDoc(doc(db, "groups", group.id), {
      stage,
      updatedAt: new Date().toISOString(),
    });

    setGroups((current) =>
      current.map((item) => (item.id === group.id ? { ...item, stage } : item)),
    );
  }

  async function togglePanelist(group: CapstoneGroup, panelistName: string) {
    const currentPanelists = group.panelists || [];
    const nextPanelists = currentPanelists.includes(panelistName)
      ? currentPanelists.filter((item) => item !== panelistName)
      : [...currentPanelists, panelistName];

    await updateDoc(doc(db, "groups", group.id), {
      panelists: nextPanelists,
      updatedAt: new Date().toISOString(),
    });

    setGroups((current) =>
      current.map((item) =>
        item.id === group.id ? { ...item, panelists: nextPanelists } : item,
      ),
    );
  }

  useEffect(() => {
    queueMicrotask(() => loadData());
  }, []);

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
                Assign advisers, panelists, and controlled workflow stages.
              </p>
            </div>

            <select
              value={course}
              onChange={(event) =>
                setCourse(event.target.value as "All" | CourseCode)
              }
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2.5 text-sm outline-none"
            >
              {courses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course / Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Members</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Adviser</th>
                  <th className="px-5 py-3 font-medium">Panelists</th>
                  <th className="px-5 py-3 font-medium">Code</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-5 py-4 font-medium text-[#203028]">
                      {group.course} {group.section}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {group.groupName}
                    </td>

                    <td className="px-5 py-4 text-[#59645d]">
                      {group.projectTitle}
                    </td>

                    <td className="px-5 py-4 text-[#59645d]">
                      {group.members?.length || 0}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={group.stage}
                        onChange={(event) =>
                          updateStage(group, event.target.value as ProjectStage)
                        }
                        className="w-44 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                      >
                        {PROJECT_STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-[#7b877f]">
                        Workflow starts from Proposal Defense.
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={group.adviserId || ""}
                        onChange={(event) =>
                          assignAdviser(group, event.target.value)
                        }
                        className="w-48 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                      >
                        <option value="">Unassigned</option>
                        {advisers.map((adviser) => (
                          <option key={adviser.uid} value={adviser.uid}>
                            {adviser.fullName}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-sm flex-wrap gap-2">
                        {panelists.length === 0 ? (
                          <span className="text-xs text-[#7b877f]">
                            No panelists yet
                          </span>
                        ) : (
                          panelists.map((panelist) => {
                            const selected = group.panelists?.includes(
                              panelist.fullName,
                            );

                            return (
                              <button
                                key={panelist.uid}
                                type="button"
                                onClick={() =>
                                  togglePanelist(group, panelist.fullName)
                                }
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                  selected
                                    ? "border-[#94d29a] bg-[#d7f7d8] text-[#203028]"
                                    : "border-[#dfe8df] bg-white text-[#59645d]"
                                }`}
                              >
                                {panelist.fullName}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs font-semibold text-[#4f8f58]">
                      {group.groupCode}
                    </td>
                  </tr>
                ))}

                {!loading && filteredGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-sm text-[#7b877f]"
                    >
                      No groups found. Create a group from the student setup
                      page first.
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
