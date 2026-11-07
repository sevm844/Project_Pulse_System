"use client";

import DeanShell from "../_components/DeanShell";
import StaffRequirements from "../../_components/requirements/StaffRequirements";

export default function DeanRequirementsPage() {
  return (
    <DeanShell title="Requirements">
      <StaffRequirements role="Dean" />
    </DeanShell>
  );
}
