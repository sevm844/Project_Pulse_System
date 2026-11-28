"use client";

import AdviserShell from "../_components/AdviserShell";
import DefenseBoard from "../../_components/defenses/DefenseBoard";
import AdviserMonitoring from "../../_components/groups/AdviserMonitoring";

export default function AdviserDefensePage() {
  return (
    <AdviserShell title="Defenses">
      <DefenseBoard role="Adviser" />
      <div className="mx-auto max-w-6xl">
        <AdviserMonitoring />
      </div>
    </AdviserShell>
  );
}
