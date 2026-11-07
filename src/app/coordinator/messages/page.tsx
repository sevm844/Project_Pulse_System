"use client";

import CoordinatorShell from "../_components/CoordinatorShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function CoordinatorMessagesPage() {
  return (
    <RoleMessagesPage
      fitViewport
      subtitle="Final requirement collection communication"
      shell={(children) => (
        <CoordinatorShell title="Messages" hideContentTitle fitViewport>
          {children}
        </CoordinatorShell>
      )}
    />
  );
}
