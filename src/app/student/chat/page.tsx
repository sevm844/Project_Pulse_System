"use client";

import StudentShell from "../_components/StudentShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function StudentChatPage() {
  return (
    <RoleMessagesPage
      role="Student"
      senderName="Student Name"
      subtitle="Group and academic communication"
      shell={(children) => (
        <StudentShell title="Chat">{children}</StudentShell>
      )}
    />
  );
}
