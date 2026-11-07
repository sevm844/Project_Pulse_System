"use client";

import PanelistShell from "./_components/PanelistShell";
import PanelistDefenses from "../_components/defenses/PanelistDefenses";

export default function PanelistDashboardPage() {
  return (
    <PanelistShell title="Defenses">
      <PanelistDefenses />
    </PanelistShell>
  );
}
