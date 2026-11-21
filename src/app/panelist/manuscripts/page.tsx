"use client";

import PanelistShell from "../_components/PanelistShell";
import StaffManuscripts from "../../_components/manuscript/StaffManuscripts";

// The panelist reads the submitted manuscript versions of every group they are on the panel for (read only, no comments).
export default function PanelistManuscriptsPage() {
  return (
    <PanelistShell title="Manuscripts">
      <StaffManuscripts role="Panelist" />
    </PanelistShell>
  );
}
