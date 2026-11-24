"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudentShell from "../../_components/StudentShell";
import GoogleManuscriptPanel from "../../../_components/manuscript/GoogleManuscriptPanel";
import ManuscriptEditor from "../../../_components/manuscript/ManuscriptEditor";
import { fetchGoogleManuscript, type GoogleManuscriptStatus } from "../../../_lib/googleManuscript";

// The manuscript is written in the system's own editor, unless the school has switched on Google Docs (the server answers which).
export default function StudentOfficialManuscriptPage() {
  const [google, setGoogle] = useState<GoogleManuscriptStatus | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    fetchGoogleManuscript()
      .then((status) => {
        if (!cancelled) setGoogle(status);
      })
      .catch(() => {
        // If the answer cannot be read, fall back to the system's own editor rather than a blank page.
        if (!cancelled) setGoogle(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StudentShell title="Manuscript">
      <Link href="/student/manuscript" className="mb-3 inline-block text-xs font-semibold text-[#123f2b] hover:underline">
        ← All documents
      </Link>
      {google === undefined && <p className="text-sm text-[#7b877f]">Loading...</p>}
      {google?.enabled ? <GoogleManuscriptPanel docUrl={google.doc_url} /> : google !== undefined && <ManuscriptEditor />}
    </StudentShell>
  );
}
