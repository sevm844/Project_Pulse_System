"use client";

import AdminShell from "../_components/AdminShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function AdminMessagesPage() {
  return (
    <RoleMessagesPage
      role="Admin"
      senderName="Admin"
      subtitle="System-wide communication"
      shell={(children) => (
        <AdminShell title="Messages">{children}</AdminShell>
      )}
    />
  );
}
