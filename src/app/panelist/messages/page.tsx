"use client";

import PanelistShell from "../_components/PanelistShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function PanelistMessagesPage() {
  return (
    <RoleMessagesPage
      role="Panelist"
      senderName="Panelist"
      subtitle="Defense panel communication"
      shell={(children) => (
        <PanelistShell title="Messages">{children}</PanelistShell>
      )}
    />
  );
}
