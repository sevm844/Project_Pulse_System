"use client";

import AdviserShell from "./_components/AdviserShell";
import StaffHome from "../_components/requirements/StaffHome";

export default function AdviserDashboardPage() {
  return (
    <AdviserShell title="Overview">
      <StaffHome role="Adviser" />
    </AdviserShell>
  );
}
