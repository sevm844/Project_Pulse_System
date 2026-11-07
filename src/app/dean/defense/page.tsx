"use client";

import DeanShell from "../_components/DeanShell";
import DefenseBoard from "../../_components/defenses/DefenseBoard";

export default function DeanDefensePage() {
  return (
    <DeanShell title="Defenses">
      <DefenseBoard role="Dean" />
    </DeanShell>
  );
}
