"use client";

import Link from "next/link";
import StudentShell from "../../_components/StudentShell";
import ManuscriptEditor from "../../../_components/manuscript/ManuscriptEditor";

export default function StudentOfficialManuscriptPage() {
  return (
    <StudentShell title="Manuscript">
      <Link href="/student/manuscript" className="mb-3 inline-block text-xs font-semibold text-[#123f2b] hover:underline">
        ← All documents
      </Link>
      <ManuscriptEditor />
    </StudentShell>
  );
}
