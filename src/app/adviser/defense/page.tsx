"use client";

import { useEffect, useMemo, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  assignedGroups,
  courses,
  sections,
  type AssignedGroup,
  type CourseCode,
  type GroupStage,
} from "../_data/mockAdviserData";
import {
  createDefensePlanForGroup,
  getStoredDefensePlans,
  saveStoredDefensePlan,
  type DefenseFile,
  type DefenseFileStatus,
  type DefensePanelist,
  type DefensePlan,
  type DefenseReadinessStatus,
  type DefenseRequirement,
  type DefenseRequirementStatus,
} from "../../_utils/defenseStorage";

const stages: GroupStage[] = [
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
];

type SetupTab = "Overview" | "Schedule" | "Panel" | "Requirements" | "Files";

const setupTabs: SetupTab[] = [
  "Overview",
  "Schedule",
  "Panel",
  "Requirements",
  "Files",
];

type StoredStudentGroupSnapshot = {
  course?: CourseCode;
  section?: string;
  groupName?: string;
  projectTitle?: string;
  title?: string;
  stage?: GroupStage;
  adviser?: string;
};

const STUDENT_GROUP_STORAGE_KEY = "project-pulse-student-group";

function getStoredStudentGroupForAdviser(): StoredStudentGroupSnapshot | null {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(STUDENT_GROUP_STORAGE_KEY);
  if (!saved) return null;

  return JSON.parse(saved) as StoredStudentGroupSnapshot;
}

function getDefenseGroups(): AssignedGroup[] {
  const savedGroup = getStoredStudentGroupForAdviser();

  if (!savedGroup) return assignedGroups;

  const currentStudentGroup: AssignedGroup = {
    id: 1,
    course: savedGroup.course || "BSIT",
    section: savedGroup.section || "4A",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    groupName: savedGroup.groupName || "Project Pulse",
    projectTitle:
      savedGroup.projectTitle ||
      savedGroup.title ||
      "Smart Capstone Monitoring System",
    stage: savedGroup.stage || "Proposal Review",
    adviser: savedGroup.adviser || "Anna Cruz",
    lastSubmission: "Today",
    progress: 68,
    status: "Active",
  };

  return [
    currentStudentGroup,
    ...assignedGroups.filter((group) => group.id !== currentStudentGroup.id),
  ];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdviserDefensePage() {
  const [plans, setPlans] = useState<DefensePlan[]>([]);
  const [groups, setGroups] = useState<AssignedGroup[]>(assignedGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState<"All" | GroupStage>("All");
  const [activeTab, setActiveTab] = useState<SetupTab>("Overview");

  useEffect(() => {
    setGroups(getDefenseGroups());
    setPlans(getStoredDefensePlans());
  }, []);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesCourse = course === "All" || group.course === course;
      const matchesSection = section === "All" || group.section === section;
      const matchesStage = stage === "All" || group.stage === stage;

      return matchesCourse && matchesSection && matchesStage;
    });
  }, [course, groups, section, stage]);

  const selectedGroup = selectedGroupId
    ? groups.find((group) => group.id === selectedGroupId)
    : null;

  const selectedPlan = selectedGroupId
    ? plans.find((plan) => plan.groupId === selectedGroupId) || null
    : null;

  function openGroupSetup(groupId: number) {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;

    const existingPlan = plans.find((plan) => plan.groupId === group.id);

    if (existingPlan) {
      setSelectedGroupId(group.id);
      setActiveTab("Overview");
      return;
    }

    const nextPlan = createDefensePlanForGroup(group);
    const savedPlan = saveStoredDefensePlan(nextPlan);

    setPlans((current) => [savedPlan, ...current]);
    setSelectedGroupId(group.id);
    setActiveTab("Overview");
  }

  function updateSelectedPlan(updates: Partial<DefensePlan>) {
    if (!selectedPlan) return;

    const savedPlan = saveStoredDefensePlan({
      ...selectedPlan,
      ...updates,
    });

    setPlans((current) =>
      current.map((plan) =>
        plan.groupId === savedPlan.groupId ? savedPlan : plan,
      ),
    );
  }

  function updateReadiness(status: DefenseReadinessStatus) {
    updateSelectedPlan({ readinessStatus: status });
  }

  function updatePanelist(id: number, updates: Partial<DefensePanelist>) {
    if (!selectedPlan) return;

    updateSelectedPlan({
      panelists: selectedPlan.panelists.map((panelist) =>
        panelist.id === id ? { ...panelist, ...updates } : panelist,
      ),
    });
  }

  function updateRequirement(id: number, updates: Partial<DefenseRequirement>) {
    if (!selectedPlan) return;

    updateSelectedPlan({
      requirements: selectedPlan.requirements.map((requirement) =>
        requirement.id === id ? { ...requirement, ...updates } : requirement,
      ),
    });
  }

  function updateFile(id: number, updates: Partial<DefenseFile>) {
    if (!selectedPlan) return;

    updateSelectedPlan({
      files: selectedPlan.files.map((file) =>
        file.id === id ? { ...file, ...updates } : file,
      ),
    });
  }

  if (selectedGroup && selectedPlan) {
    const completedRequirements = selectedPlan.requirements.filter(
      (item) => item.status === "Completed",
    ).length;

    const uploadedFiles = selectedPlan.files.filter(
      (item) => item.status === "Uploaded",
    ).length;

    const totalTasks =
      selectedPlan.requirements.length + selectedPlan.files.length;

    const completedTasks = completedRequirements + uploadedFiles;

    const progress =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return (
      <AdviserShell title="Defense Setup">
        <div className="grid gap-5 md:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
                      {selectedPlan.groupName}
                    </h2>
                    <StatusBadge status={selectedPlan.readinessStatus} />
                  </div>

                  <p className="mt-2 text-sm text-[#59645d]">
                    {selectedPlan.course} {selectedPlan.section} /{" "}
                    {selectedPlan.stage}
                  </p>

                  <p className="mt-1 text-xs text-[#7b877f]">
                    {selectedPlan.projectTitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateReadiness("Ready")}
                    className="rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Mark Ready
                  </button>

                  <button
                    type="button"
                    onClick={() => updateReadiness("Not Ready")}
                    className="rounded-lg border border-[#dfe8df] px-4 py-2.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                  >
                    Mark Not Ready
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGroupId(null)}
                    className="rounded-lg border border-[#dfe8df] px-4 py-2.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                  >
                    Back
                  </button>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex gap-2 overflow-x-auto border-b border-[#edf2ec] px-4 pt-4">
                {setupTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                      activeTab === tab
                        ? "border-[#4f8f58] text-[#203028]"
                        : "border-transparent text-[#7b877f] hover:text-[#203028]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === "Overview" && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                      label="Schedule"
                      value={selectedPlan.date || "Not set"}
                      detail={selectedPlan.time || "No time yet"}
                    />
                    <SummaryCard
                      label="Venue"
                      value={selectedPlan.venue || "Not set"}
                      detail="Defense location"
                    />
                    <SummaryCard
                      label="Requirements"
                      value={`${completedRequirements}/${selectedPlan.requirements.length} done`}
                      detail="Completion status"
                    />
                    <SummaryCard
                      label="Files"
                      value={`${uploadedFiles}/${selectedPlan.files.length} uploaded`}
                      detail="Required uploads"
                    />

                    <div className="md:col-span-2 xl:col-span-4">
                      <div className="rounded-2xl border border-[#dfe8df] bg-[#fbfdfb] p-5">
                        <h3 className="text-base font-semibold text-[#203028]">
                          Quick edit
                        </h3>
                        <p className="mt-1 text-sm text-[#7b877f]">
                          Use the tabs above to update schedule, panelists,
                          requirements, or defense files without scrolling.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <QuickTabButton
                            label="Edit Schedule"
                            onClick={() => setActiveTab("Schedule")}
                          />
                          <QuickTabButton
                            label="Edit Panel"
                            onClick={() => setActiveTab("Panel")}
                          />
                          <QuickTabButton
                            label="Edit Requirements"
                            onClick={() => setActiveTab("Requirements")}
                          />
                          <QuickTabButton
                            label="Edit Files"
                            onClick={() => setActiveTab("Files")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Schedule" && (
                  <div>
                    <SectionHeader
                      title="Schedule Details"
                      description="Set the official date, time, and venue visible to students and panelists."
                    />

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      <label className="text-xs font-semibold text-[#203028]">
                        Defense Date
                        <input
                          value={selectedPlan.date}
                          onChange={(event) =>
                            updateSelectedPlan({ date: event.target.value })
                          }
                          className="mt-2 w-full rounded-lg border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                        />
                      </label>

                      <label className="text-xs font-semibold text-[#203028]">
                        Time
                        <input
                          value={selectedPlan.time}
                          onChange={(event) =>
                            updateSelectedPlan({ time: event.target.value })
                          }
                          className="mt-2 w-full rounded-lg border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                        />
                      </label>

                      <label className="text-xs font-semibold text-[#203028]">
                        Venue / Meeting Link
                        <input
                          value={selectedPlan.venue}
                          onChange={(event) =>
                            updateSelectedPlan({ venue: event.target.value })
                          }
                          className="mt-2 w-full rounded-lg border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === "Panel" && (
                  <div>
                    <SectionHeader
                      title="Defense Panel"
                      description="Manage adviser, chairperson, and panel members in one compact list."
                    />

                    <div className="mt-5 grid gap-3">
                      {selectedPlan.panelists.map((panelist) => (
                        <div
                          key={panelist.id}
                          className="grid gap-3 rounded-2xl border border-[#dfe8df] bg-white p-4 lg:grid-cols-[42px_150px_1fr_1fr]"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7f7d8] text-xs font-semibold text-[#203028]">
                            {initials(panelist.name)}
                          </div>

                          <input
                            value={panelist.role}
                            onChange={(event) =>
                              updatePanelist(panelist.id, {
                                role: event.target.value,
                              })
                            }
                            className="rounded-lg border border-[#dfe8df] px-3 py-2 text-sm font-semibold outline-none"
                          />

                          <input
                            value={panelist.name}
                            onChange={(event) =>
                              updatePanelist(panelist.id, {
                                name: event.target.value,
                              })
                            }
                            className="rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none"
                          />

                          <input
                            value={panelist.email}
                            onChange={(event) =>
                              updatePanelist(panelist.id, {
                                email: event.target.value,
                              })
                            }
                            className="rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "Requirements" && (
                  <div>
                    <SectionHeader
                      title="Requirements"
                      description="Update requirement status without scrolling to the bottom of the page."
                    />

                    <div className="mt-5 grid gap-3">
                      {selectedPlan.requirements.map((requirement) => (
                        <div
                          key={requirement.id}
                          className="grid gap-3 rounded-2xl border border-[#dfe8df] bg-white p-4 lg:grid-cols-[1fr_160px]"
                        >
                          <div>
                            <input
                              value={requirement.title}
                              onChange={(event) =>
                                updateRequirement(requirement.id, {
                                  title: event.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-[#dfe8df] px-3 py-2 text-sm font-semibold outline-none"
                            />

                            <input
                              value={requirement.detail}
                              onChange={(event) =>
                                updateRequirement(requirement.id, {
                                  detail: event.target.value,
                                })
                              }
                              className="mt-2 w-full rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none"
                            />
                          </div>

                          <select
                            value={requirement.status}
                            onChange={(event) =>
                              updateRequirement(requirement.id, {
                                status: event.target
                                  .value as DefenseRequirementStatus,
                              })
                            }
                            className="h-10 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none"
                          >
                            <option>Pending</option>
                            <option>Completed</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "Files" && (
                  <div>
                    <SectionHeader
                      title="Defense Files"
                      description="Track required files and upload status in a compact table."
                    />

                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[860px] text-left text-sm">
                        <thead className="border-b border-[#edf2ec] text-xs text-[#7b877f]">
                          <tr>
                            <th className="py-3 font-medium">File</th>
                            <th className="py-3 font-medium">Detail</th>
                            <th className="py-3 font-medium">Uploaded</th>
                            <th className="py-3 font-medium">Status</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#edf2ec]">
                          {selectedPlan.files.map((file) => (
                            <tr key={file.id}>
                              <td className="py-3 pr-3">
                                <input
                                  value={file.name}
                                  onChange={(event) =>
                                    updateFile(file.id, {
                                      name: event.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-[#dfe8df] px-3 py-2 text-sm font-semibold outline-none"
                                />
                              </td>

                              <td className="py-3 pr-3">
                                <input
                                  value={file.detail}
                                  onChange={(event) =>
                                    updateFile(file.id, {
                                      detail: event.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none"
                                />
                              </td>

                              <td className="py-3 pr-3">
                                <input
                                  value={file.uploaded}
                                  onChange={(event) =>
                                    updateFile(file.id, {
                                      uploaded: event.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none"
                                />
                              </td>

                              <td className="py-3">
                                <select
                                  value={file.status}
                                  onChange={(event) =>
                                    updateFile(file.id, {
                                      status: event.target
                                        .value as DefenseFileStatus,
                                    })
                                  }
                                  className="w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none"
                                >
                                  <option>Pending</option>
                                  <option>Uploaded</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#203028]">
                Overall Progress
              </h3>

              <div className="mt-5 flex items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-[#d7f7d8] bg-white">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#203028]">
                      {progress}%
                    </p>
                    <p className="text-[10px] text-[#7b877f]">Complete</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <ProgressRow label="Requirements" value={completedRequirements} />
                <ProgressRow label="Files" value={uploadedFiles} />
                <ProgressRow label="Remaining" value={totalTasks - completedTasks} />
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#203028]">
                Quick Actions
              </h3>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("Requirements")}
                  className="w-full rounded-xl border border-[#dfe8df] px-4 py-3 text-left text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Update Requirements
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("Files")}
                  className="w-full rounded-xl border border-[#dfe8df] px-4 py-3 text-left text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Check Files
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("Schedule")}
                  className="w-full rounded-xl border border-[#dfe8df] px-4 py-3 text-left text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Edit Schedule
                </button>
              </div>
            </Card>
          </div>
        </div>
      </AdviserShell>
    );
  }

  return (
    <AdviserShell title="Defense">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Course
              </label>
              <select
                value={course}
                onChange={(event) =>
                  setCourse(event.target.value as "All" | CourseCode)
                }
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {courses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Section
              </label>
              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {sections.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Stage
              </label>
              <select
                value={stage}
                onChange={(event) =>
                  setStage(event.target.value as "All" | GroupStage)
                }
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {stages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Groups for Defense Setup
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Select a group to open its defense setup page.
              </p>
            </div>

            <p className="text-xs font-semibold text-[#7b877f]">
              {filteredGroups.length} group/s found
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group) => {
              const plan = plans.find((item) => item.groupId === group.id);

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-[#dfe8df] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-[#4f8f58]">
                      {group.course} {group.section}
                    </p>

                    <StatusBadge status={plan?.readinessStatus || "Pending"} />
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-[#203028]">
                    {group.groupName}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#59645d]">
                    {group.projectTitle}
                  </p>

                  <p className="mt-3 text-xs text-[#7b877f]">
                    {group.stage} / Adviser: {group.adviser}
                  </p>

                  <button
                    type="button"
                    onClick={() => openGroupSetup(group.id)}
                    className="mt-5 rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Open Defense Setup
                  </button>
                </div>
              );
            })}
          </div>

          {filteredGroups.length === 0 && (
            <div className="mt-5 rounded-lg border border-dashed border-[#dfe8df] bg-[#fbfdfb] p-8 text-center">
              <p className="text-sm font-semibold text-[#203028]">
                No groups match these filters.
              </p>
              <p className="mt-2 text-xs text-[#7b877f]">
                Try selecting another course, section, or stage.
              </p>
            </div>
          )}
        </Card>
      </div>
    </AdviserShell>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe8df] bg-white p-4">
      <p className="text-xs font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#203028]">{value}</p>
      <p className="mt-1 text-xs text-[#9ba69d]">{detail}</p>
    </div>
  );
}

function QuickTabButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
    >
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-[#203028]">{title}</h3>
      <p className="mt-1 text-sm text-[#7b877f]">{description}</p>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#7b877f]">{label}</span>
      <span className="text-xs font-semibold text-[#203028]">{value}</span>
    </div>
  );
}