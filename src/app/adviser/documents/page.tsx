"use client";

import AdviserShell from "../_components/AdviserShell";
import DocumentLibrary from "../../_components/documents/DocumentLibrary";

export default function AdviserDocumentsPage() {
  return (
    <AdviserShell title="Documents">
      <DocumentLibrary role="Adviser" />
    </AdviserShell>
  );
}
