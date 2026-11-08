"use client";

import DeanShell from "../_components/DeanShell";
import DocumentLibrary from "../../_components/documents/DocumentLibrary";

export default function DeanDocumentsPage() {
  return (
    <DeanShell title="Documents">
      <DocumentLibrary role="Dean" />
    </DeanShell>
  );
}
