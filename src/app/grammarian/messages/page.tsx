"use client";

import GrammarianShell from "../_components/GrammarianShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function GrammarianMessagesPage() {
  return (
    <RoleMessagesPage
      fitViewport
      role="Grammarian"
      senderName="Grammarian"
      subtitle="Grammar review and certificate communication"
      shell={(children) => (
        <GrammarianShell title="Messages" hideContentTitle fitViewport>
          {children}
        </GrammarianShell>
      )}
    />
  );
}
