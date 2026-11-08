"use client";

import StudentShell from "../_components/StudentShell";
import DocumentLibrary from "../../_components/documents/DocumentLibrary";

export default function StudentDocumentsPage() {
  return (
    <StudentShell title="Documents">
      <DocumentLibrary role="Student" />
    </StudentShell>
  );
}
