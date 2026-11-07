"use client";

import AdviserShell from "../_components/AdviserShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function AdviserMessagesPage() {
  return (
    <RoleMessagesPage      fitViewport
      subtitle="Adviser group communication"
      shell={(children) => (
        <AdviserShell title="Messages" hideContentTitle fitViewport>
          {children}
        </AdviserShell>
      )}
    />
  );
}
