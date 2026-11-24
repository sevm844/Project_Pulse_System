"use client";

import RoleProfileContent from "../../_components/RoleProfileContent";
import DeanShell from "../_components/DeanShell";

export default function DeanProfilePage() {
  return (
    <DeanShell title="Settings" hideContentTitle>
      <RoleProfileContent role="Dean" slug="dean" />
    </DeanShell>
  );
}
