"use client";

import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function RecordsMessagesPage() {
  return (
    <RoleMessagesPage
      role="Records Staff"
      senderName="Records Staff"
      subtitle="Archive and records communication"
      shell={(children) => (
        <main className="min-h-screen bg-white p-6 text-[#1f2a24]">
          {children}
        </main>
      )}
    />
  );
}
