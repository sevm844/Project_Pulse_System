"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import StudentShell from "../../_components/StudentShell";
import DocumentEditor from "../../../_components/manuscript/DocumentEditor";

export default function StudentDocumentPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const id = Number(params.id);
  // Set when the student pressed Edit on a Word form of the Forms shelf: that form's text is copied in once.
  const formId = Number(search.get("fromForm"));

  return (
    <StudentShell title="Manuscript">
      {Number.isInteger(id) && id > 0 ? (
        <DocumentEditor key={id} documentId={id} fromFormId={Number.isInteger(formId) && formId > 0 ? formId : undefined} />
      ) : (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-red-600">This document does not exist.</p>
          <Link href="/student/manuscript" className="text-sm font-semibold text-[#123f2b]">← All documents</Link>
        </div>
      )}
    </StudentShell>
  );
}
