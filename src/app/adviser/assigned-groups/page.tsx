"use client";

import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import type {
  CapstoneGroup,
  UserProfile,
  CourseCode as FirebaseCourseCode,
} from "../../_lib/firebase";
import {
  getAdviserCreatedGroups,
  isGroupConfirmed,
  subscribeToGroupAssignments,
  saveAdviserCreatedGroup,
} from "../../_utils/groupAssignmentStorage";
import {
  assignedGroups,
  courses,
  sections,
  type CourseCode,
} from "../_data/mockAdviserData";

import { auth, db } from "../../_lib/firebase";
import { getStoredUserUid } from "../../_utils/authStorage";
import { GROUP_SEMESTERS, buildSelectedGroupMembers, getAvailableStudents, isSchoolYear } from "../../_utils/studentSelection";
import { PROJECT_STAGES } from "../../_utils/projectWorkflow";

const stages = [...PROJECT_STAGES, "Proposal Review"] as const;

const groupCreationCourses: FirebaseCourseCode[] = ["BSIT", "BSCS", "BSIS"];

function generateInternalGroupCode() {
  return `ADV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export default function AssignedGroupsPage() {
  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState("All");
  const [createdGroups, setCreatedGroups] = useState<CapstoneGroup[]>(() =>
    getAdviserCreatedGroups(),
  );
  const [groupName, setGroupName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [createCourse, setCreateCourse] = useState<FirebaseCourseCode>("BSIT");
  const [createSection, setCreateSection] = useState("4A");
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentLoadAttempt, setStudentLoadAttempt] = useState(0);
  const [adviserId, setAdviserId] = useState("");
  const [semester, setSemester] = useState("1st Semester");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leaderUid, setLeaderUid] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createMessageType, setCreateMessageType] = useState<
    "success" | "error" | ""
  >("");
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const availableStudents = getAvailableStudents(students, createdGroups, schoolYear, semester);
  const adviserGroups = createdGroups.filter((group) => group.adviserId === adviserId);
  const selectedMembers = buildSelectedGroupMembers(availableStudents, leaderUid, selectedIds);
  const memberCount = availableStudents.filter((student) => student.uid === leaderUid || selectedIds.includes(student.uid)).length;
  const validMembers = Boolean(selectedMembers) && !studentsLoading && !studentsError;
  const detailsReady = Boolean(groupName.trim() && createCourse && createSection && isSchoolYear(schoolYear) && semester);
  const readySteps = Number(detailsReady) + Number(validMembers);

  function resetMembers() { setSelectedIds([]); setLeaderUid(""); }

  useEffect(() => {
    queueMicrotask(() => setAdviserId(getStoredUserUid() || ""));
  }, []);

  useEffect(() => {
    if (!showCreateWizard) return;
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      setStudents([]); setStudentsError("");
      if (!user) {
        setStudentsLoading(false);
        setStudentsError("Sign in to load registered students.");
        return;
      }
      setAdviserId(user.uid);
      setStudentsLoading(true);
      try {
        const snapshot = await getDocs(query(collection(db, "users"), where("role", "==", "Student")));
        const registeredStudents = snapshot.docs.map((item) => ({ ...item.data(), uid: item.id }) as UserProfile);
        if (!cancelled) setStudents(registeredStudents);
      } catch {
        if (!cancelled) setStudentsError("Unable to load registered students. Check your connection and adviser access to student accounts, then retry.");
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [showCreateWizard, studentLoadAttempt]);

  useEffect(() => {
    const refresh = () => setCreatedGroups(getAdviserCreatedGroups());
    queueMicrotask(refresh);
    return subscribeToGroupAssignments(refresh);
  }, []);

  const createdGroupRows = useMemo(
    () =>
      createdGroups.filter((group) => group.adviserId === adviserId && isGroupConfirmed(group)).map((group) => ({
        id: group.id,
        course: group.course,
        section: group.section,
        groupName: group.groupName,
        projectTitle: group.projectTitle || "Awaiting student title proposals",
        stage: group.stage,
        lastSubmission: "No submission yet",
        progress: group.progress,
        status: group.status,
      })),
    [createdGroups, adviserId],
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
    const members = buildSelectedGroupMembers(
      getAvailableStudents(students, getAdviserCreatedGroups(), schoolYear, semester), leaderUid, selectedIds,
    );
    if (!adviserId || !detailsReady || !validMembers || !members) {
      setCreateMessage("Complete the group details, select a group leader, and add at least one member.");
      setCreateMessageType("error");
      return;
    }

    const now = new Date().toISOString();
    const nextGroup: CapstoneGroup = {
      id: `adviser-group-${crypto.randomUUID()}`,
      groupName: groupName.trim(),
      projectTitle: "",
      schoolYear,
      semester,
      groupCode: generateInternalGroupCode(),
      course: createCourse,
      section: createSection,
      members,
      leaderId: leaderUid,
      adviserId,
      adviserName: auth.currentUser?.displayName || auth.currentUser?.email || "Adviser",
      panelists: [],
      stage: "Proposal Defense",
      progress: 0,
      status: "Pending Student Confirmation",
      createdAt: now,
      updatedAt: now,
    };

    saveAdviserCreatedGroup(nextGroup);
    setCreateMessage(
      "Invitation created. Track each member's response in Group Invitations below. Student Confirmation completes when all members accept.",
    );
    setCreateMessageType("success");
    setGroupName("");
    setSchoolYear("");
    resetMembers();
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
                Select a group leader and members from registered student accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
          </div>

          {createMessage && createMessageType === "success" && (
            <p className="mt-4 rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-4 py-3 text-xs font-semibold text-[#4f8f58]">
              {createMessage}
            </p>
          )}
        </Card>

        {showCreateWizard && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2a24]/55 p-2 sm:p-4 backdrop-blur-sm">
            <div className="grid max-h-[calc(100dvh-1rem)] min-h-0 w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-[0_28px_80px_rgba(31,42,36,0.28)] sm:max-h-[calc(100dvh-2rem)] lg:grid-cols-[210px_minmax(0,1fr)]">
              <aside className="hidden border-r border-[#edf2ec] bg-[#f7fbf6] p-4 lg:flex lg:flex-col lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#203028]">
                    Group Setup Wizard
                  </h2>
                  <div className="mt-3 h-1.5 rounded-full bg-[#dfe8df]" role="progressbar" aria-label="Invitation setup" aria-valuenow={readySteps} aria-valuemin={0} aria-valuemax={2}>
                    <div className="h-1.5 rounded-full bg-[#123f2b] transition-all" style={{ width: `${readySteps / 2 * 100}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-[#7b877f]">{readySteps}/2 ready to invite</p>
                  <div className="mt-5 space-y-3 text-xs" aria-live="polite">
                    {[["Group Details", detailsReady], ["Student Members", validMembers], ["Student Confirmation", false]].map(([label, complete], index) => (
                      <div key={String(label)} className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${complete ? "border-[#123f2b] bg-[#123f2b] text-white" : "border-[#b8c4bb] text-[#7b877f]"}`} aria-label={complete ? "Complete" : "Pending"}>{complete ? "✓" : index + 1}</span>
                        <span className="font-semibold text-[#203028]">{label}</span>
                      </div>
                    ))}
                    <p className="text-[11px] leading-5 text-[#7b877f]">All members must accept before Student Confirmation is complete.</p>
                  </div>
                </div>

                <p className="text-[11px] leading-5 text-[#7b877f]">
                  Students accept the invitation in their portal.
                </p>
              </aside>

              <section className="flex min-h-0 min-w-0 flex-col overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="create-group-title">
                <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[#edf2ec] px-4 py-3">
                  <div>
                    <h2 id="create-group-title" className="text-lg font-semibold tracking-tight text-[#203028]">
                      Create Capstone Group
                    </h2>
                    <p className="mt-1 text-xs text-[#7b877f]">
                      Choose a leader and members to send group invitations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateWizard(false)}
                    aria-label="Close create group wizard"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-[#59645d] transition hover:bg-[#f3f7f1]"
                  >
                    X
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#59645d]">
                        Group Name
                      </label>
                      <input
                        placeholder="e.g., Project Pulse"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
                      />
                    </div>
                    <div>
                      <label htmlFor="school-year" className="text-xs font-semibold text-[#59645d]">School Year</label>
                      <input id="school-year" placeholder="e.g., 2026-2027" value={schoolYear} onChange={(e) => { setSchoolYear(e.target.value); resetMembers(); }} className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#59645d]">
                        Course
                      </label>
                      <select
                        value={createCourse}
                        onChange={(e) =>
                          { setCreateCourse(e.target.value as FirebaseCourseCode); resetMembers(); }
                        }
                        className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
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
                        onChange={(e) => { setCreateSection(e.target.value); resetMembers(); }}
                        className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]"
                      >
                        {sections.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <label className="block text-xs font-semibold text-[#59645d]">Semester
                      <select value={semester} onChange={(event) => { setSemester(event.target.value); resetMembers(); }} className="mt-1 w-full rounded-md border border-[#dfe8df] h-9 px-2.5 py-1.5 text-xs">{GROUP_SEMESTERS.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                  </div>

                  <div className="space-y-2.5">
                    {studentsLoading && <p role="status" className="text-xs text-[#7b877f]">Loading registered students...</p>}
                    {studentsError && <div role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-800"><p>{studentsError}</p><button type="button" onClick={() => setStudentLoadAttempt((attempt) => attempt + 1)} className="mt-2 underline">Retry loading students</button></div>}
                    {!studentsLoading && !studentsError && availableStudents.length === 0 && <p className="rounded-lg bg-[#f8faf7] p-2 text-xs text-[#7b877f]">No available students. Register accounts first; already invited students are excluded.</p>}
                    <label className="block text-xs font-semibold text-[#59645d]">Group Leader
                      <select value={availableStudents.some((student) => student.uid === leaderUid) ? leaderUid : ""} disabled={studentsLoading || Boolean(studentsError)} onChange={(event) => { setLeaderUid(event.target.value); setSelectedIds((current) => current.filter((uid) => uid !== event.target.value)); }} className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs disabled:bg-gray-50">
                        <option value="">Select the group leader</option>
                        {availableStudents.map((student) => <option key={student.uid} value={student.uid}>{student.fullName} / {student.email}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-[#59645d]">Student Members
                      <select value="" disabled={!availableStudents.some((student) => student.uid === leaderUid) || studentsLoading || Boolean(studentsError)} onChange={(event) => { const uid = event.target.value; if (uid) setSelectedIds((current) => current.includes(uid) ? current : [...current, uid]); }} className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs disabled:bg-gray-50">
                        <option value="">Select a student to add as a member</option>
                        {availableStudents.filter((student) => student.uid !== leaderUid && !selectedIds.includes(student.uid)).map((student) => <option key={student.uid} value={student.uid}>{student.fullName} / {student.email}</option>)}
                      </select>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableStudents
                        .filter((student) => selectedIds.includes(student.uid) && student.uid !== leaderUid)
                        .map((student) => (
                          <span
                            key={student.uid}
                            className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#dce9df] bg-[#f2f8f3] py-0.5 pl-2.5 pr-0.5 text-xs font-medium text-[#244b35]"
                          >
                            <span title={student.fullName} className="min-w-0 truncate">{student.fullName}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedIds((current) => current.filter((uid) => uid !== student.uid))}
                              aria-label={`Remove ${student.fullName}`}
                              title={`Remove ${student.fullName}`}
                              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#688271] transition-colors hover:bg-[#dce9df] hover:text-[#123f2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f8f58] focus-visible:ring-offset-2"
                            >
                              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="m6 6 12 12M18 6 6 18" />
                              </svg>
                            </button>
                          </span>
                        ))}
                    </div>
                    <p className="text-xs text-[#7b877f]">Choose the leader first, then add members.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#edf2ec] bg-[#fbfdfb] p-2.5">
                    <div>
                      <p className="text-[10px] font-semibold text-[#7b877f]">
                        Adviser
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-[#203028]">
                        {auth.currentUser?.displayName || auth.currentUser?.email || "Adviser"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[#7b877f]">
                        Stage
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-[#203028]">
                        Proposal Defense
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[#7b877f]">
                        Students Added
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-[#203028]">
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

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#edf2ec] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateWizard(false)}
                    className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#59645d] transition hover:bg-[#f3f7f1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={!adviserId || !detailsReady || !validMembers}
                    className="rounded-lg bg-[#07845f] px-3 py-2 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(7,132,95,0.2)] transition hover:bg-[#066f50] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create Invitation
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Group Invitations</h2>
          <p className="mt-1 text-sm text-[#7b877f]">Sending an invitation completes setup. Student Confirmation completes only when all members accept.</p>
          <div className="mt-4 space-y-4">
            {adviserGroups.length === 0 && <p className="text-sm text-[#7b877f]">No invitations yet. Create a group to invite its members.</p>}
            {adviserGroups.map((group) => {
              const confirmed = isGroupConfirmed(group);
              const accepted = group.members.filter((member) => member.acceptedAt).length;
              return <div key={group.id} className="rounded-xl border border-[#dfe8df] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-semibold text-[#203028]">{group.groupName}</h3><p className="mt-1 text-xs text-[#7b877f]">{group.course} · {group.section} · {group.schoolYear || "School year not recorded"} / {group.semester || "Semester not recorded"}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${confirmed ? "bg-[#e7f5e9] text-[#123f2b]" : "bg-amber-50 text-amber-800"}`}>{confirmed ? "✓ Student Confirmation complete" : "Student Confirmation pending"} · {accepted}/{group.members.length} accepted</span>
                </div>
                <p className="mt-3 text-xs font-medium text-[#4f8f58]">✓ Group Details · ✓ Student Members · {confirmed ? "✓ Student Confirmation" : "Student Confirmation pending"}</p>
                <ul className="mt-3 divide-y divide-[#edf2ec]">
                  {group.members.map((member) => <li key={member.email} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{member.email} <span className="text-xs text-[#7b877f]">({member.role})</span></span><span className={member.acceptedAt ? "text-[#4f8f58]" : "text-amber-700"}>{member.acceptedAt ? "Accepted" : "Pending acceptance"}</span></li>)}
                </ul>
              </div>;
            })}
          </div>
        </Card>

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
