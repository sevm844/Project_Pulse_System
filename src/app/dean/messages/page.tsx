"use client";

import DeanShell from "../_components/DeanShell";
import RoleMessagesPage from "../../_components/RoleMessagesPage";

export default function DeanMessagesPage() {
  return (
    <RoleMessagesPage
      fitViewport
      subtitle="Executive communication center"
      shell={(children) => (
        <DeanShell title="Messages" fitViewport>{children}</DeanShell>
      )}
    />
  );
}
