"use client";

import SecretaryShell from "../_components/SecretaryShell";
import StaffRequirements from "../../_components/requirements/StaffRequirements";

export default function SecretaryRequirementsPage() {
  return (
    <SecretaryShell title="Requirements">
      <StaffRequirements role="Secretary" />
    </SecretaryShell>
  );
}
