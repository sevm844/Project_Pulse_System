"use client";

import StudentShell from "../_components/StudentShell";
import StudentDefenses from "../../_components/defenses/StudentDefenses";

export default function StudentDefensePage() {
  return (
    <StudentShell title="Defense">
      <StudentDefenses />
    </StudentShell>
  );
}
