"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import RemoveMemberDialog from "../../_components/groups/RemoveMemberDialog";
import { GroupStatusNote, StageBadge } from "../../_components/ProposalStage";
import type { CourseCode, UserProfile } from "../../_lib/types";
import { apiFetch } from "../../_lib/api";
import {
  closeGroup,
  COURSE_OPTIONS,
  errorMessage,
  isGroupConfirmed,
  NO_TITLE_YET,
  removeGroupMember,
  SECTION_OPTIONS,
  setGroupLeader,
  type ApiGroup,
  type ApiGroupMember,
  type RemovalReason,
} from "../../_lib/groups";
import { getStoredUserEmail } from "../../_utils/authStorage";
import { GROUP_SEMESTERS, MAX_GROUP_SIZE, buildSelectedGroupMembers, isSchoolYear } from "../../_utils/studentSelection";
import { PROPOSAL_STAGES } from "../../_utils/projectWorkflow";

const groupCreationCourses = COURSE_OPTIONS as CourseCode[];

function generateInternalGroupCode() {
  return `ADV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export default function AssignedGroupsPage() {
  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState("All");
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [groupsError, setGroupsError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [createCourse, setCreateCourse] = useState<CourseCode>("BSIT");
  const [createSection, setCreateSection] = useState("4A");
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentLoadAttempt, setStudentLoadAttempt] = useState(0);
  const [semester, setSemester] = useState("1st Semester");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leaderUid, setLeaderUid] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createMessageType, setCreateMessageType] = useState<
    "success" | "error" | ""
  >("");
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adviserEmail] = useState(() => getStoredUserEmail() || "Adviser");
  const [removing, setRemoving] = useState<{ group: ApiGroup; member: ApiGroupMember } | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  // The backend already leaves out students who are in a group for this school year + semester.
  const availableStudents = students;
  const activeSchoolYear = isSchoolYear(schoolYear) ? schoolYear : "";
  const selectedMembers = buildSelectedGroupMembers(availableStudents, leaderUid, selectedIds);
  const memberCount = availableStudents.filter((student) => student.uid === leaderUid || selectedIds.includes(student.uid)).length;
  const validMembers = Boolean(selectedMembers) && !studentsLoading && !studentsError;
  const detailsReady = Boolean(groupName.trim() && createCourse && createSection && isSchoolYear(schoolYear) && semester);
  const readySteps = Number(detailsReady) + Number(validMembers);

  function resetMembers() { setSelectedIds([]); setLeaderUid(""); }

  // Leader change / closure, then refresh the list. Errors from the server are shown as they are.
  async function groupAction(action: () => Promise<ApiGroup>, message: string) {
    setActionBusy(true);
    setGroupsError("");
    setActionNotice("");

    try {
      await action();
      await loadGroups();
      setActionNotice(message);
    } catch (err) {
      setGroupsError(errorMessage(err, "That did not work. Please try again."));
    }

    setActionBusy(false);
  }

  async function removeMember(category: RemovalReason, details: string) {
    if (!removing) return;

    setActionBusy(true);
    setRemoveError("");

    try {
      await removeGroupMember(removing.group.group_id, removing.member.user_id, category, details);
      await loadGroups();
      setActionNotice(`${removing.member.name} was removed. The reason was saved to the audit log.`);
      setRemoving(null);
    } catch (err) {
      setRemoveError(errorMessage(err, "Unable to remove this member."));
    }

    setActionBusy(false);
  }

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await apiFetch<ApiGroup[]>("/groups"));
      setGroupsError("");
    } catch (err) {
      setGroupsError(errorMessage(err, "Unable to load your groups."));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadGroups());
  }, [loadGroups]);

  useEffect(() => {
    if (!showCreateWizard) return;
    let cancelled = false;
    async function loadStudents() {
      if (cancelled) return;
      setStudents([]); setStudentsError(""); setStudentsLoading(true);
      try {
        // Adviser-only endpoint: returns Active students only.
        const params = new URLSearchParams();
        if (activeSchoolYear) {
          params.set("school_year", activeSchoolYear);
          params.set("semester", semester);
        }
        const query = params.toString();
        const available = await apiFetch<
          Array<{ user_id: number; fname: string; lname: string; email: string }>
        >(`/students/available${query ? `?${query}` : ""}`);
        const registeredStudents = available.map((student): UserProfile => ({
          uid: String(student.user_id),
          email: student.email,
          fullName: `${student.fname} ${student.lname}`.trim(),
          role: "Student",
          status: "Active",
          createdAt: "",
        }));
        if (!cancelled) setStudents(registeredStudents);
      } catch (err) {
        if (!cancelled) {
          setStudentsError(errorMessage(err, "Unable to load registered students. Check your connection, then retry."));
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    }
    queueMicrotask(loadStudents);
    return () => { cancelled = true; };
  }, [showCreateWizard, studentLoadAttempt, activeSchoolYear, semester]);

  const confirmedGroups = useMemo(() => groups.filter(isGroupConfirmed), [groups]);

  const filteredGroups = useMemo(() => {
    return confirmedGroups.filter((group) => {
      const matchesCourse = course === "All" || group.course === course;
      const matchesSection = section === "All" || group.section === section;
      const matchesStage = stage === "All" || group.project?.proposal_stage === stage;

      return matchesCourse && matchesSection && matchesStage;
    });
  }, [confirmedGroups, course, section, stage]);

  async function handleCreateGroup() {
    if (!detailsReady || !validMembers || !selectedMembers) {
      setCreateMessage("Complete the group details and select a group leader. You can add up to 2 more members.");
      setCreateMessageType("error");
      return;
    }

    setCreating(true);
    setCreateMessage("");
    setCreateMessageType("");

    try {
      await apiFetch<ApiGroup>("/groups", {
        method: "POST",
        body: JSON.stringify({
          group_name: groupName.trim(),
          group_code: generateInternalGroupCode(),
          course: createCourse,
          section: createSection,
          school_year: schoolYear,
          semester,
          leader_id: Number(leaderUid),
          member_ids: selectedIds.filter((uid) => uid !== leaderUid).map(Number),
        }),
      });
    } catch (err) {
      setCreateMessage(errorMessage(err, "Unable to create the group."));
      setCreateMessageType("error");
      setCreating(false);
      return;
    }

    await loadGroups();
    setCreateMessage(
      "Invitation created. Track each member's response in Group Invitations below. Student Confirmation completes when all members accept.",
    );
    setCreateMessageType("success");
    setGroupName("");
    setSchoolYear("");
    resetMembers();
    setCreating(false);
    setShowCreateWizard(false);
  }

  return (
    <AdviserShell title="Assigned Groups">
      <div className="space-y-5">
        <Card className="border-[#dfe8df] bg-white/88 p-5 shadow-[0_18px_48px_rgba(32,48,40,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f8f58]">
                Title proposal phase
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[#203028]">
                Adviser-managed group creation
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7b877f]">
                A group has 1 to 3 students: the leader plus up to 2 members, chosen from approved student accounts.
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

        {showCreateWizard && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f2a24]/55 p-2 sm:p-4 backdrop-blur-sm">
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
                      <input id="school-year" placeholder="e.g., 2026-2027" value={schoolYear} onChange={(e) => { const value = e.target.value; if (isSchoolYear(value) || activeSchoolYear) resetMembers(); setSchoolYear(value); }} className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]" />
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
                          { setCreateCourse(e.target.value as CourseCode); resetMembers(); }
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
                        {SECTION_OPTIONS.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div><label htmlFor="semester" className="text-xs font-semibold text-[#59645d]">Semester</label>
                      <select id="semester" value={semester} onChange={(event) => { setSemester(event.target.value); resetMembers(); }} className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs outline-none focus:border-[#94d29a] focus:ring-2 focus:ring-[#d7f7d8]">{GROUP_SEMESTERS.map((item) => <option key={item}>{item}</option>)}</select>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p role="status" className="h-4 text-xs text-[#7b877f]">{studentsLoading ? "Loading registered students..." : ""}</p>
                    {studentsError && <div role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-800"><p>{studentsError}</p><button type="button" onClick={() => setStudentLoadAttempt((attempt) => attempt + 1)} className="mt-2 underline">Retry loading students</button></div>}
                    {!studentsLoading && !studentsError && availableStudents.length === 0 && <p className="rounded-lg bg-[#f8faf7] p-2 text-xs text-[#7b877f]">No available students. Students must be approved by the Research Coordinator first; students already in a group for this school year and semester are excluded.</p>}
                    <label className="block text-xs font-semibold text-[#59645d]">Group Leader
                      <select value={availableStudents.some((student) => student.uid === leaderUid) ? leaderUid : ""} disabled={studentsLoading || Boolean(studentsError)} onChange={(event) => { setLeaderUid(event.target.value); setSelectedIds((current) => current.filter((uid) => uid !== event.target.value)); }} className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs disabled:bg-gray-50">
                        <option value="">Select the group leader</option>
                        {availableStudents.map((student) => <option key={student.uid} value={student.uid}>{student.fullName} / {student.email}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-[#59645d]">Student Members
                      <select value="" disabled={!availableStudents.some((student) => student.uid === leaderUid) || selectedIds.length >= MAX_GROUP_SIZE - 1 || studentsLoading || Boolean(studentsError)} onChange={(event) => { const uid = event.target.value; if (uid) setSelectedIds((current) => current.includes(uid) ? current : [...current, uid]); }} className="mt-1 w-full rounded-md border border-[#dfe8df] bg-white h-9 px-2.5 py-1.5 text-xs disabled:bg-gray-50">
                        <option value="">{selectedIds.length >= MAX_GROUP_SIZE - 1 ? "The group is full (3 students)" : "Select a student to add as a member (optional)"}</option>
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
                    <p className="text-xs text-[#7b877f]">Choose the leader first, then add up to 2 members (a group of 1, 2 or 3 is fine). Enter the school year to hide students who already have a group.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#edf2ec] bg-[#fbfdfb] p-2.5">
                    <div>
                      <p className="text-[10px] font-semibold text-[#7b877f]">
                        Adviser
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-[#203028]">
                        {adviserEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[#7b877f]">
                        Stage
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-[#203028]">
                        Title Proposal
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
                    disabled={creating || !detailsReady || !validMembers}
                    className="rounded-lg bg-[#07845f] px-3 py-2 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(7,132,95,0.2)] transition hover:bg-[#066f50] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Invitation"}
                  </button>
                </div>
              </section>
            </div>
          </div>,
          document.body,
        )}

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Group Invitations</h2>
          <p className="mt-1 text-sm text-[#7b877f]">Sending an invitation completes setup. Student Confirmation completes only when all members accept.</p>
          {groupsError && <p role="alert" className="mt-3 text-sm text-[#b42318]">{groupsError}</p>}
          {actionNotice && <p role="status" className="mt-3 text-sm text-[#4f8f58]">{actionNotice}</p>}
          <div className="mt-4 space-y-4">
            {groups.length === 0 && !groupsError && <p className="text-sm text-[#7b877f]">No invitations yet. Create a group to invite its members.</p>}
            {groups.map((group) => {
              const confirmed = isGroupConfirmed(group);
              const accepted = group.members.filter((member) => member.accepted_at).length;
              return <div key={group.group_id} className="rounded-xl border border-[#dfe8df] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-semibold text-[#203028]">{group.group_name}<GroupStatusNote status={group.group_status} /></h3><p className="mt-1 text-xs text-[#7b877f]">{group.course} · {group.section} · {group.school_year || "School year not recorded"} / {group.semester || "Semester not recorded"}</p>{group.project && <div className="mt-2"><StageBadge stage={group.project.proposal_stage} /></div>}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${confirmed ? "bg-[#e7f5e9] text-[#123f2b]" : "bg-amber-50 text-amber-800"}`}>{confirmed ? "✓ Student Confirmation complete" : "Student Confirmation pending"} · {accepted}/{group.members.length} accepted</span>
                </div>
                <p className="mt-3 text-xs font-medium text-[#4f8f58]">✓ Group Details · ✓ Student Members · {confirmed ? "✓ Student Confirmation" : "Student Confirmation pending"}</p>
                <ul className="mt-3 divide-y divide-[#edf2ec]">
                  {group.members.map((member) => <li key={member.member_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span>{member.name} <span className="text-xs text-[#7b877f]">({member.role_in_group})</span></span><span className="flex flex-wrap items-center gap-2"><span className={member.accepted_at ? "text-[#4f8f58]" : "text-amber-700"}>{member.accepted_at ? "Accepted" : "Pending acceptance"}</span>{group.group_status === "Active" && member.role_in_group !== "Leader" && <button type="button" disabled={actionBusy} onClick={() => void groupAction(() => setGroupLeader(group.group_id, member.user_id), `${member.name} is now the leader of ${group.group_name}.`)} className="rounded-full border border-[#dfe8df] px-3 py-1 text-[11px] font-semibold hover:bg-[#edf9e9] disabled:opacity-60">Make leader</button>}{group.group_status === "Active" && !group.project?.endorsement && <button type="button" disabled={actionBusy} onClick={() => { setRemoveError(""); setRemoving({ group, member }); }} className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Remove</button>}</span></li>)}
                  {group.members.length === 0 && <li className="py-2 text-sm text-[#7b877f]">No members left.</li>}
                </ul>
                {group.project?.endorsement && group.group_status === "Active" && <p className="mt-2 text-[11px] text-[#7b877f]">Membership is locked after the Dean&apos;s endorsement. Only the Dean&apos;s office can make an exception.</p>}
                {group.group_status === "Pending Closure" && <div className="mt-3 flex flex-wrap items-center gap-3"><p className="text-xs text-amber-700">Every member left. Confirm to close this group; its history is kept.</p><button type="button" disabled={actionBusy} onClick={() => void groupAction(() => closeGroup(group.group_id), `${group.group_name} was closed. Its history is kept.`)} className="rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60">Confirm closure</button></div>}
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
                {COURSE_OPTIONS.map((item) => (
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
                {SECTION_OPTIONS.map((item) => (
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
                {PROPOSAL_STAGES.map((item) => (
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
              Confirmed groups you advise, filtered by course, section, and stage.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project Title</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Members</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredGroups.map((group) => (
                  <tr key={group.group_id} className="hover:bg-[#fbfdfb]">
                    <td className="px-5 py-4 font-medium text-[#203028]">
                      {group.course}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.section}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {group.group_name}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.project?.project_title || NO_TITLE_YET}
                    </td>
                    <td className="px-5 py-4">
                      {group.project ? <StageBadge stage={group.project.proposal_stage} /> : "-"}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.members.length}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status="Active" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/adviser/requirements"
                          className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
                        >
                          Title Proposals
                        </Link>
                        <Link
                          href="/adviser/messages"
                          className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Chat
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-sm text-[#7b877f]"
                    >
                      No confirmed groups found. A group appears here once all its members accept.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {removing && (
        <RemoveMemberDialog
          memberName={removing.member.name}
          groupName={removing.group.group_name}
          busy={actionBusy}
          error={removeError}
          onCancel={() => setRemoving(null)}
          onSubmit={(category, details) => void removeMember(category, details)}
        />
      )}
    </AdviserShell>
  );
}
