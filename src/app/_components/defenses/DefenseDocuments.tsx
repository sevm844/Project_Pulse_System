"use client";

import { useEffect, useState } from "react";
import { apiFetch, downloadSubmission } from "../../_lib/api";
import type { ApiDefenseDocument } from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";

// The group's approved documents, for whoever sits on or oversees the defense.
export default function DefenseDocuments({ defenseId }: { defenseId: number }) {
  const [documents, setDocuments] = useState<ApiDefenseDocument[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setDocuments(await apiFetch<ApiDefenseDocument[]>(`/defenses/${defenseId}/documents`));
      } catch (err) {
        setError(errorMessage(err, "Unable to load the documents."));
      }
    }

    void load();
  }, [defenseId]);

  async function open(document: ApiDefenseDocument) {
    try {
      await downloadSubmission(document.submission_id, document.file_name);
    } catch (err) {
      setError(errorMessage(err, "Unable to open the file."));
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold text-[#203028]">Approved documents</p>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-[#b42318]">
          {error}
        </p>
      )}

      {documents === null && !error && <p className="mt-1.5 text-xs text-[#7b877f]">Loading...</p>}

      {documents?.length === 0 && (
        <p className="mt-1.5 text-xs text-[#7b877f]">Nothing has been approved for this group yet.</p>
      )}

      {documents && documents.length > 0 && (
        <ul className="mt-1.5 divide-y divide-[#edf2ec] text-xs">
          {documents.map((document) => (
            <li key={document.submission_id} className="flex items-center justify-between gap-4 py-2">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-[#203028]">{document.title}</span>
                <span className="text-[#9aa59e]">
                  {document.stage} · version {document.version_no}
                </span>
              </span>

              {document.has_file && (
                <button
                  type="button"
                  onClick={() => void open(document)}
                  className="shrink-0 font-semibold text-[#4f8f58] hover:underline"
                >
                  Open file
                </button>
              )}

              {document.link_url && (
                <a
                  href={document.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-semibold text-[#4f8f58] hover:underline"
                >
                  Open link
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
