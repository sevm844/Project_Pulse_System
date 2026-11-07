"use client";

import RoleProfileContent from "../../_components/RoleProfileContent";
import CoordinatorShell from "../_components/CoordinatorShell";

export default function CoordinatorProfilePage() {
  return (
    <CoordinatorShell title="Profile" hideContentTitle>
      <RoleProfileContent role="Coordinator" slug="coordinator" />
    </CoordinatorShell>
  );
}
