"use client";

import CoordinatorShell from "../_components/CoordinatorShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function CoordinatorMessagesPage() {
  return (
    <RoleMessagesPage
      role="Coordinator"
      senderName="Coordinator"
      subtitle="Final requirement collection communication"
      shell={(children) => (
        <CoordinatorShell title="Messages">{children}</CoordinatorShell>
      )}
    />
  );
}
