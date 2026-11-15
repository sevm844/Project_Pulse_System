"use client";

import StudentShell from "../_components/StudentShell";
import StudentDefenses from "../../_components/defenses/StudentDefenses";
import StudentSchedule from "../../_components/defenses/StudentSchedule";

export default function StudentDefensePage() {
  return (
    <StudentShell title="Defense">
      <StudentDefenses />
      <div className="mx-auto max-w-4xl">
        <StudentSchedule />
      </div>
    </StudentShell>
  );
}
