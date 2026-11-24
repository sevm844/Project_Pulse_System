"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StudentShell from "../_components/StudentShell";
import StudentAssignments from "../../_components/requirements/StudentAssignments";

// The page reads ?subject= and ?tab= (set by older links), so it sits inside a Suspense boundary.
export default function StudentRequirementsPage() {
  return (
    <Suspense fallback={null}>
      <StudentRequirementsContent />
    </Suspense>
  );
}

function StudentRequirementsContent() {
  const search = useSearchParams();
  const subject = search.get("subject") === "appdev" ? "appdev" : search.get("subject") === "cap" ? "cap" : null;

  return (
    <StudentShell title="Requirements">
      <StudentAssignments subject={subject} startOnForms={search.get("tab") === "forms"} />
    </StudentShell>
  );
}
