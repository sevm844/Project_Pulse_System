"use client";

import AdviserShell from "../_components/AdviserShell";
import StaffRequirements from "../../_components/requirements/StaffRequirements";

export default function AdviserRequirementsPage() {
  return (
    <AdviserShell title="Requirements">
      <StaffRequirements role="Adviser" />
    </AdviserShell>
  );
}
