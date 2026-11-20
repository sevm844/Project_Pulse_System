"use client";

import SecretaryShell from "../_components/SecretaryShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function SecretaryMessagesPage() {
  return (
    <RoleMessagesPage
      fitViewport
      subtitle="Final requirement collection communication"
      shell={(children) => (
        <SecretaryShell title="Messages" hideContentTitle fitViewport>
          {children}
        </SecretaryShell>
      )}
    />
  );
}
