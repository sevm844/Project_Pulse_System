"use client";

import GrammarianShell from "./_components/GrammarianShell";
import StaffHome from "../_components/requirements/StaffHome";
import CapSubjectCard from "../_components/classes/CapSubjectCard";

export default function GrammarianDashboardPage() {
  return (
    <GrammarianShell title="Overview">
      <CapSubjectCard note="You check the manuscripts and the final outputs of the groups of this subject, the Dean's subject, and issue their certificate of editing." />
      <StaffHome role="Grammarian" />
    </GrammarianShell>
  );
}
