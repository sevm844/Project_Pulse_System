"use client";

import RoleProfileContent from "../../_components/RoleProfileContent";
import PanelistShell from "../_components/PanelistShell";

export default function PanelistProfilePage() {
  return (
    <PanelistShell title="Settings" hideContentTitle>
      <RoleProfileContent role="Panelist" slug="panelist" />
    </PanelistShell>
  );
}
