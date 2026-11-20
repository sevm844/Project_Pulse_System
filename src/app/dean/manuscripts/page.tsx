"use client";

import DeanShell from "../_components/DeanShell";
import StaffManuscripts from "../../_components/manuscript/StaffManuscripts";

export default function DeanManuscriptsPage() {
  return (
    <DeanShell title="Manuscripts">
      <StaffManuscripts role="Dean" />
    </DeanShell>
  );
}
