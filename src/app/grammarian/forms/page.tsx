"use client";

import GrammarianShell from "../_components/GrammarianShell";
import FormsShelf from "../../_components/requirements/FormsShelf";

// The Dean's forms, kept on one shelf for everyone (read only).
export default function GrammarianFormsPage() {
  return (
    <GrammarianShell title="Forms">
      <FormsShelf role="Grammarian" />
    </GrammarianShell>
  );
}
