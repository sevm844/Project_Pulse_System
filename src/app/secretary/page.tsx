"use client";

import SecretaryShell from "./_components/SecretaryShell";
import StaffHome from "../_components/requirements/StaffHome";
import CapSubjectCard from "../_components/classes/CapSubjectCard";

export default function SecretaryDashboardPage() {
  return (
    <SecretaryShell title="Overview">
      <CapSubjectCard note="You receive the final outputs of the groups of this subject, the Dean's subject, and archive their projects." />
      <StaffHome role="Secretary" />
    </SecretaryShell>
  );
}
