"use client";

import { useEffect, useState } from "react";
import DocumentReviews from "./DocumentReviews";
import ManuscriptView from "./ManuscriptView";
import { fetchSharedDocument, fetchSharedDocuments, type GroupDocument, type GroupDocumentFull } from "../../_lib/groupDocuments";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";
import { getStoredUserRole } from "../../_utils/authStorage";

// The extra documents a group's members chose to share with the adviser or the Dean. Read only. Nothing shows when nothing was shared.
export default function SharedDocuments({ projectId }: { projectId: number }) {
  const [docs, setDocs] = useState<GroupDocument[]>([]);
  const [open, setOpen] = useState<GroupDocumentFull | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchSharedDocuments(projectId)
      .then((list) => !cancelled && setDocs(list))
      .catch(() => !cancelled && setDocs([]));

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function read(id: number) {
    setError("");

    try {
      setOpen(await fetchSharedDocument(id));
    } catch (err) {
      setError(errorMessage(err, "Unable to open the document."));
    }
  }

  if (docs.length === 0) return null;

  const role = getStoredUserRole() === "Dean" ? "Dean" : "Adviser";

  return (
    <div className="mb-4 rounded-xl border border-[#dfe8df] bg-[#f8fbf8] p-3">
      <p className="text-sm font-semibold text-[#203028]">Other documents shared with you</p>
      <ul className="mt-2 divide-y divide-[#e6eee7]">
        {docs.map((doc) => (
          <li key={doc.document_id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-[#203028]">{doc.title}</p>
              <p className="text-xs text-[#7b877f]">Edited {formatDateTime(doc.saved_at)}{doc.saved_by ? ` · ${doc.saved_by}` : ""}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <DocumentReviews
                documentId={doc.document_id}
                title={doc.title}
                role={role}
                buttonClass="rounded-full border border-[#cfe0d3] bg-white px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]"
              />
              <button type="button" onClick={() => void read(doc.document_id)} className="rounded-full border border-[#cfe0d3] bg-white px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                Read now
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" aria-label={open.title} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#dfe8df] px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-[#203028]">{open.title}</h3>
                <p className="text-xs text-[#7b877f]">Read only · shared by the group</p>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                Close
              </button>
            </div>
            <div className="overflow-auto">
              <ManuscriptView content={open.content} heightClass="max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
