"use client";

import CoordinatorShell from "../_components/CoordinatorShell";
import StaffRequirements from "../../_components/requirements/StaffRequirements";

export default function CoordinatorRequirementsPage() {
  return (
    <CoordinatorShell title="Requirements">
      <StaffRequirements role="Coordinator" />
    </CoordinatorShell>
  );
}
