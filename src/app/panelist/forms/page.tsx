"use client";

import PanelistShell from "../_components/PanelistShell";
import FormsShelf from "../../_components/requirements/FormsShelf";

// The Dean's forms, kept on one shelf for everyone (read only).
export default function PanelistFormsPage() {
  return (
    <PanelistShell title="Forms">
      <FormsShelf role="Panelist" />
    </PanelistShell>
  );
}
