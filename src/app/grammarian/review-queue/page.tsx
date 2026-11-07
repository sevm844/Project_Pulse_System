"use client";

import GrammarianShell from "../_components/GrammarianShell";
import StaffRequirements from "../../_components/requirements/StaffRequirements";

export default function GrammarianReviewQueuePage() {
  return (
    <GrammarianShell title="Review Queue">
      <StaffRequirements role="Grammarian" />
    </GrammarianShell>
  );
}
