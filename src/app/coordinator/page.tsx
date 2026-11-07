"use client";

import CoordinatorShell from "./_components/CoordinatorShell";
import StaffHome from "../_components/requirements/StaffHome";

export default function CoordinatorDashboardPage() {
  return (
    <CoordinatorShell title="Overview">
      <StaffHome role="Coordinator" />
    </CoordinatorShell>
  );
}
