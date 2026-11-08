import type { UserProfile } from "../_lib/types";

export const GROUP_SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

// A group is 1 to 3 students: the leader plus up to 2 other members.
export const MAX_GROUP_SIZE = 3;

export type SelectedGroupMember = {
  uid: string;
  name: string;
  email: string;
  role: "Group Leader" | "Member";
};

export function isSchoolYear(value: string) {
  return /^\d{4}-\d{4}$/.test(value) && Number(value.slice(5)) === Number(value.slice(0, 4)) + 1;
}

// The leader plus up to MAX_GROUP_SIZE - 1 other members (none is fine: a group can be a single student),
// all taken from the available students.
export function buildSelectedGroupMembers(students: UserProfile[], leaderUid: string, memberUids: string[]): SelectedGroupMember[] | null {
  const leader = students.find((student) => student.uid === leaderUid);
  const uniqueMembers = [...new Set(memberUids)].filter((uid) => uid !== leaderUid);
  if (!leader || uniqueMembers.length > MAX_GROUP_SIZE - 1) return null;
  const members = uniqueMembers.map((uid) => students.find((student) => student.uid === uid));
  if (members.some((student) => !student)) return null;
  return [
    { uid: leader.uid, name: leader.fullName, email: leader.email.trim().toLowerCase(), role: "Group Leader" },
    ...members.map((student) => ({ uid: student!.uid, name: student!.fullName, email: student!.email.trim().toLowerCase(), role: "Member" as const })),
  ];
}
