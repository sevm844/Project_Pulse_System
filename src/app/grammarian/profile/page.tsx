"use client";

import RoleProfileContent from "../../_components/RoleProfileContent";
import GrammarianShell from "../_components/GrammarianShell";

export default function GrammarianProfilePage() {
  return (
    <GrammarianShell title="Profile" hideContentTitle>
      <RoleProfileContent role="Grammarian" slug="grammarian" />
    </GrammarianShell>
  );
}
