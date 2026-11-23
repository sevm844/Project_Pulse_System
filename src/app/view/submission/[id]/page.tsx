"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DocxPreview from "../../../_components/documents/DocxPreview";
import { DOCX_TYPE, downloadSubmission, previewSubmission } from "../../../_lib/api";
import { errorMessage } from "../../../_lib/groups";
import { getStoredToken } from "../../../_utils/authStorage";

// A submitted Word file, opened in its own browser tab (the "Open" buttons on every file a student sends). It is read in the browser and shown as
// pages; the real file is one Download button away. Nobody gets in without signing in, and the server checks the same access rule as a download.
export default function ViewSubmissionPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const id = Number(params.id);
  const name = search.get("name") || "document.docx";
  const versionParam = search.get("v");
  const version = versionParam ? Number(versionParam) : undefined;
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    let made: string | null = null;

    previewSubmission(id, DOCX_TYPE, version)
      .then((address) => {
        made = address;
        if (cancelled) URL.revokeObjectURL(address);
        else setUrl(address);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "This file is not available or you do not have access to it."));
      });

    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id, version, router]);

  return (
    <div className="flex h-dvh flex-col bg-[#f3f7f1]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#dfe8df] bg-white px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#203028]">{name}</p>
          <p className="text-[11px] text-[#9aa59e]">Project Pulse{version ? ` · Version ${version}` : ""}</p>
        </div>
        <button
          type="button"
          onClick={() => void downloadSubmission(id, name, version).catch((err) => setError(errorMessage(err, "Unable to download the file.")))}
          className="shrink-0 rounded-lg border border-[#cfe0d3] bg-white px-4 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4]"
        >
          Download
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {error ? (
          <p role="alert" className="p-6 text-sm text-[#b42318]">
            {error}
          </p>
        ) : url ? (
          <DocxPreview url={url} name={name} heightClass="max-h-[calc(100dvh-10.5rem)]" />
        ) : (
          <p className="p-6 text-sm text-[#7b877f]">Opening the file...</p>
        )}
      </main>
    </div>
  );
}
