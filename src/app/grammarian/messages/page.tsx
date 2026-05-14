"use client";

import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function GrammarianMessagesPage() {
  return (
    <RoleMessagesPage
      role="Grammarian"
      senderName="Grammarian"
      subtitle="Grammar review communication"
      shell={(children) => (
        <main className="min-h-screen bg-white p-6 text-[#1f2a24]">
          <div className="mb-6">
            <p className="text-[11px] font-medium text-[#7b877f]">
              Grammarian Workspace
            </p>
            <h1 className="text-2xl font-semibold">Messages</h1>
          </div>
          {children}
        </main>
      )}
    />
  );
}
