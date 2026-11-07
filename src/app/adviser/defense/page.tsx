"use client";

import AdviserShell from "../_components/AdviserShell";
import DefenseBoard from "../../_components/defenses/DefenseBoard";

export default function AdviserDefensePage() {
  return (
    <AdviserShell title="Defenses">
      <DefenseBoard role="Adviser" />
    </AdviserShell>
  );
}
