"use client";

import RoleProfileContent from "../../_components/RoleProfileContent";
import SecretaryShell from "../_components/SecretaryShell";

export default function SecretaryProfilePage() {
  return (
    <SecretaryShell title="Profile" hideContentTitle>
      <RoleProfileContent role="Secretary" slug="secretary" />
    </SecretaryShell>
  );
}
