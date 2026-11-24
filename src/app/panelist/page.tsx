"use client";

import PanelistShell from "./_components/PanelistShell";
import PanelistDefenses from "../_components/defenses/PanelistDefenses";
import RoleCalendar from "../_components/RoleCalendar";
import CapSubjectCard from "../_components/classes/CapSubjectCard";

export default function PanelistDashboardPage() {
  return (
    <PanelistShell title="Defenses">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <CapSubjectCard note="You sit on the panels of the groups of this subject, the Dean's subject. You read their manuscript and score the defenses you are assigned to." />
          <PanelistDefenses />
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <RoleCalendar role="Panelist" />
        </div>
      </div>
    </PanelistShell>
  );
}
