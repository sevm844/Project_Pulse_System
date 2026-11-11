"use client";

import StudentShell from "../_components/StudentShell";
import ManuscriptEditor from "../../_components/manuscript/ManuscriptEditor";

export default function StudentManuscriptPage() {
  return (
    <StudentShell title="Manuscript">
      <ManuscriptEditor />
    </StudentShell>
  );
}
