"use client";

import AdviserShell from "../_components/AdviserShell";
import StaffManuscripts from "../../_components/manuscript/StaffManuscripts";

export default function AdviserManuscriptsPage() {
  return (
    <AdviserShell title="Manuscripts">
      <StaffManuscripts role="Adviser" />
    </AdviserShell>
  );
}
