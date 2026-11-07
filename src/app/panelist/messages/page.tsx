"use client";

import PanelistShell from "../_components/PanelistShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function PanelistMessagesPage() {
  return (
    <RoleMessagesPage
      fitViewport
      subtitle="Defense panel communication"
      shell={(children) => (
        <PanelistShell title="Messages" hideContentTitle fitViewport>
          {children}
        </PanelistShell>
      )}
    />
  );
}
