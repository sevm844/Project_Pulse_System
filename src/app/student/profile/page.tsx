"use client";

import RoleProfileContent from "../../_components/RoleProfileContent";
import StudentShell from "../_components/StudentShell";

export default function StudentProfilePage() {
  return (
    <StudentShell title="Profile" hideContentTitle>
      <RoleProfileContent role="Student" slug="student" />
    </StudentShell>
  );
}
