"use client";

import GrammarianShell from "./_components/GrammarianShell";
import StaffHome from "../_components/requirements/StaffHome";

export default function GrammarianDashboardPage() {
  return (
    <GrammarianShell title="Overview">
      <StaffHome role="Grammarian" />
    </GrammarianShell>
  );
}
