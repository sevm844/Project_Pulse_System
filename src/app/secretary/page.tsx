"use client";

import SecretaryShell from "./_components/SecretaryShell";
import StaffHome from "../_components/requirements/StaffHome";

export default function SecretaryDashboardPage() {
  return (
    <SecretaryShell title="Overview">
      <StaffHome role="Secretary" />
    </SecretaryShell>
  );
}
