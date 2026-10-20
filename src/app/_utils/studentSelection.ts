import type { CapstoneGroup, GroupMemberRecord, UserProfile } from "../_lib/firebase";

export const GROUP_SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

export function isSchoolYear(value: string) {
  return /^\d{4}-\d{4}$/.test(value) && Number(value.slice(5)) === Number(value.slice(0, 4)) + 1;
}

export function getAvailableStudents(students: UserProfile[], groups: CapstoneGroup[], schoolYear: string, semester: string) {
  const reserved = new Set(groups.filter((group) => group.schoolYear === schoolYear && (!group.semester || group.semester === semester))
    .flatMap((group) => group.members.map((member) => member.email.trim().toLowerCase())));
  const seen = new Set<string>();
  return students.filter((student) => {
    const email = student.email?.trim().toLowerCase();
    if (student.role !== "Student" || student.status !== "Active" || !student.uid || !email || reserved.has(email) || seen.has(email)) return false;
    seen.add(email);
    return true;
  }).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function buildSelectedGroupMembers(students: UserProfile[], leaderUid: string, memberUids: string[]): GroupMemberRecord[] | null {
  const leader = students.find((student) => student.uid === leaderUid);
  const uniqueMembers = [...new Set(memberUids)].filter((uid) => uid !== leaderUid);
  if (!leader || uniqueMembers.length === 0) return null;
  const members = uniqueMembers.map((uid) => students.find((student) => student.uid === uid));
  if (members.some((student) => !student)) return null;
  return [
    { uid: leader.uid, name: leader.fullName, email: leader.email.trim().toLowerCase(), role: "Group Leader" },
    ...members.map((student) => ({ uid: student!.uid, name: student!.fullName, email: student!.email.trim().toLowerCase(), role: "Member" as const })),
  ];
}
