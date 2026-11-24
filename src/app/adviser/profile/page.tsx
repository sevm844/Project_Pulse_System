"use client";

import RoleProfileContent from "../../_components/RoleProfileContent";
import AdviserShell from "../_components/AdviserShell";

export default function AdviserProfilePage() {
  return (
    <AdviserShell title="Settings" hideContentTitle>
      <RoleProfileContent role="Adviser" slug="adviser" />
    </AdviserShell>
  );
}
