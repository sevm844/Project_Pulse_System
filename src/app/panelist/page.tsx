"use client";

import PanelistShell from "./_components/PanelistShell";
import PanelistDefenses from "../_components/defenses/PanelistDefenses";
import RoleCalendar from "../_components/RoleCalendar";

export default function PanelistDashboardPage() {
  return (
    <PanelistShell title="Defenses">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <PanelistDefenses />
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <RoleCalendar role="Panelist" />
        </div>
      </div>
    </PanelistShell>
  );
}
