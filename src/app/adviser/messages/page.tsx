"use client";

import AdviserShell from "../_components/AdviserShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function AdviserMessagesPage() {
  return (
    <RoleMessagesPage
      role="Adviser"
      senderName="Anna Cruz"
      subtitle="Adviser group communication"
      shell={(children) => (
        <AdviserShell title="Messages">{children}</AdviserShell>
      )}
    />
  );
}
