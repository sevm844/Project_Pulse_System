"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import type {
  CapstoneGroup,
  CourseCode as FirebaseCourseCode,
} from "../../_lib/firebase";
import {
  getAdviserCreatedGroups,
  saveAdviserCreatedGroup,
} from "../../_utils/groupAssignmentStorage";
import {
  assignedGroups,
  courses,
  sections,
  type CourseCode,
} from "../_data/mockAdviserData";

const stages = [
  "Proposal Defense",
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
] as const;

const groupCreationCourses: FirebaseCourseCode[] = ["BSIT", "BSCS", "BSIS"];

function generateInternalGroupCode() {
  return `ADV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function getMemberName(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseStudentEmails(value: string) {
  return value
    .split(/[\n,]/)
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email, index) => ({
      email,
      name: getMemberName(email),
      role: index === 0 ? ("Group Leader" as const) : ("Member" as const),
    }));
}

export default function AssignedGroupsPage() {
  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState("All");
  const [createdGroups, setCreatedGroups] = useState<CapstoneGroup[]>(() =>
    getAdviserCreatedGroups(),
  );
  const [groupName, setGroupName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [createCourse, setCreateCourse] = useState<FirebaseCourseCode>("BSIT");
  const [createSection, setCreateSection] = useState("4A");
  const [studentEmails, setStudentEmails] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createMessageType, setCreateMessageType] = useState<
    "success" | "error" | ""
  >("");
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const memberCount = useMemo(
    () => parseStudentEmails(studentEmails).length,
    [studentEmails],
  );

  const createdGroupRows = useMemo(
    () =>
      createdGroups.map((group) => ({
        id: group.id,
        course: group.course,
        section: group.section,
        groupName: group.groupName,
        projectTitle: group.projectTitle,
        stage: group.stage,
        lastSubmission: "No submission yet",
        progress: group.progress,
        status: group.status,
      })),
    [createdGroups],
  );

  const allGroups = useMemo(
    () => [...createdGroupRows, ...assignedGroups],
    [createdGroupRows],
  );

  const filteredGroups = useMemo(() => {
    return allGroups.filter((group) => {
      const matchesCourse = course === "All" || group.course === course;
      const matchesSection = section === "All" || group.section === section;
      const matchesStage = stage === "All" || group.stage === stage;

      return matchesCourse && matchesSection && matchesStage;
    });
  }, [allGroups, course, section, stage]);

  function handleCreateGroup() {
    const members = parseStudentEmails(studentEmails);

    if (!groupName.trim() || !projectTitle.trim() || members.length === 0) {
      setCreateMessage(
        "Please enter a group name, project title, and at least one student email.",
      );
      setCreateMessageType("error");
      return;
    }

    const now = new Date().toISOString();
    const nextGroup: CapstoneGroup = {
      id: `adviser-group-${Date.now()}`,
      groupName: groupName.trim(),
      projectTitle: projectTitle.trim(),
      groupCode: generateInternalGroupCode(),
      course: createCourse,
      section: createSection,
      members,
      leaderId: "",
      adviserId: "adviser-anna-cruz",
      adviserName: "Anna Cruz",
      panelists: [],
      stage: "Proposal Defense",
      progress: 0,
      status: "Pending Student Confirmation",
      createdAt: now,
      updatedAt: now,
    };

    saveAdviserCreatedGroup(nextGroup);
    setCreatedGroups((currentGroups) => [nextGroup, ...currentGroups]);
    setCreateMessage(
      "Group created. Students listed in this group will see an invitation when they log in.",
    );
    setCreateMessageType("success");
    setGroupName("");
    setProjectTitle("");
    setStudentEmails("");
    setShowCreateWizard(false);
  }

  return (
    <AdviserShell title="Assigned Groups">
      <div className="space-y-5">
        <Card className="border-[#dfe8df] bg-white/88 p-5 shadow-[0_18px_48px_rgba(32,48,40,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f8f58]">
                AppDev proposal phase
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[#203028]">
                Adviser-managed group creation
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7b877f]">
                Create official capstone groups and invite students by their
                registered email only when you need to add a new group.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateMessage("");
                setCreateMessageType("");
                setShowCreateWizard(true);
              }}
              className="rounded-lg bg-[#123f2b] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(32,40,35,0.16)] transition hover:bg-[#0f3324]"
            >
              Create Group
            </button>
          </div>

          {createMessage && createMessageType === "success" && (
            <p className="mt-4 rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-4 py-3 text-xs font-semibold text-[#4f8f58]">
              {createMessage}
            </p>
          )}
        </Card>

        {showCreateWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a24]/55 px-4 py-6 backdrop-blur-sm">
            <div className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-[0_28px_80px_rgba(31,42,36,0.28)] lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="hidden border-r border-[#edf2ec] bg-[#f7fbf6] p-6 lg:flex lg:flex-col lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#203028]">
                    Group Setup Wizard
                  </h2>
                  <div className="mt-5 h-1.5 rounded-full bg-[#dfe8df]">
                    <div className="h-1.5 w-2/3 rounded-full bg-[#123f2b]" />
                  </div>
                  <p className="mt-3 text-xs font-medium text-[#7b877f]">
                    2/3 ready to invite
                  </p>

                  <div className="mt-8 space-y-5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#123f2b] text-[10px] font-bold text-white">
                        1
                      </span>
                      <span className="font-semibold text-[#203028]">
                        Group Details
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded-full border-2 border-[#123f2b]" />
                      <span className="font-semibold text-[#203028]">
                        Student Members
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded-full border border-[#b8c4bb]" />
                      <span className="text-[#7b877f]">Student Confirmation</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-6 text-[#7b877f]">
                  Students will see the invitation in their portal after they
                  log in with a matching registered email.
                </p>
              </aside>

              <section className="overflow-y-auto">
                <div className="flex items-start justify-between gap-4 border-b border-[#edf2ec] px-6 py-5">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
                      Create Capstone Group
                    </h2>
                    <p className="mt-1 text-sm text-[#7b877f]">
                      Add group details and invite student members.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateWizard(false)}
                    aria-label="Close create group wizard"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-[#59645d] transition hover:bg-[#f3f7f1]"
                  >
                    X
                  </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-[#59645d]">
                        Group Name
                      </label>
                      <input
                        placeholder="e.g., Project Pulse"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#59645d]">
                        Tentative Capstone Title
                      </label>
                      <input
                        placeholder="e.g., Smart Capstone Monitoring System"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-[#59645d]">
                        Course
                      </label>
                      <select
                        value={createCourse}
                        onChange={(e) =>
                          setCreateCourse(e.target.value as FirebaseCourseCode)
                        }
                        className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
                      >
                        {groupCreationCourses.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#59645d]">
                        Section
                      </label>
                      <select
                        value={createSection}
                        onChange={(e) => setCreateSection(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
                      >
                        {sections.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#59645d]">
                      Student Members
                    </label>
                    <textarea
                      placeholder="Enter student UB emails, separated by comma or new line"
                      value={studentEmails}
                      onChange={(e) => setStudentEmails(e.target.value)}
                      className="mt-2 min-h-32 w-full resize-none rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
                    />
                    <p className="mt-2 text-xs text-[#7b877f]">
                      The first email will be marked as Group Leader. Other
                      emails will be added as Members.
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-lg border border-[#edf2ec] bg-[#fbfdfb] p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Adviser
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#203028]">
                        Anna Cruz
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Stage
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#203028]">
                        Proposal Defense
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Students Added
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#203028]">
                        {memberCount}
                      </p>
                    </div>
                  </div>

                  {createMessage && createMessageType === "error" && (
                    <p className="rounded-lg border border-[#f4d1d1] bg-[#fff7f7] px-4 py-3 text-xs font-semibold text-[#b42318]">
                      {createMessage}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[#edf2ec] px-6 py-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateWizard(false)}
                    className="rounded-lg border border-[#dfe8df] px-5 py-3 text-sm font-semibold text-[#59645d] transition hover:bg-[#f3f7f1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    className="rounded-lg bg-[#07845f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(7,132,95,0.2)] transition hover:bg-[#066f50]"
                  >
                    Create Invitation
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Course
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value as "All" | CourseCode)}
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
                onChange={(e) => setSection(e.target.value)}
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
                onChange={(e) => setStage(e.target.value)}
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

        {/* Groups table */}
        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Group List
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Adviser view is filtered by assigned course, section, stage, and
              academic period.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project Title</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Last Submission</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-[#fbfdfb]">
                    <td className="px-5 py-4 font-medium text-[#203028]">
                      {group.course}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.section}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {group.groupName}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.projectTitle}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.stage}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.lastSubmission}
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-2 w-32 rounded-full bg-[#edf2ec]">
                        <div
                          className="h-2 rounded-full bg-[#94d29a]"
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {group.progress}%
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={group.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/adviser/reviews"
                          className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Open Latest
                        </Link>
                        <Link
                          href="/adviser/messages"
                          className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Chat
                        </Link>
                        <Link
                          href="/adviser/defense"
                          className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
                        >
                          Endorse / Hold
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-sm text-[#7b877f]"
                    >
                      No assigned groups found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdviserShell>
  );
}
