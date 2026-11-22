"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createGroupDocument, deleteGroupDocument, fetchManuscriptHome, type ManuscriptHome as Home } from "../../_lib/groupDocuments";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";

function sharedText(adviser: boolean, dean: boolean, adviserName: string | null) {
  if (adviser && dean) return "Shared with your adviser and the Dean";
  if (adviser) return `Shared with ${adviserName ?? "your adviser"}`;
  if (dean) return "Shared with the Dean";

  return "Only your group";
}

const cardClass =
  "group flex min-h-[132px] flex-col justify-between rounded-xl border border-[#dfe8df] bg-white p-4 text-left shadow-[0_1px_2px_rgba(23,28,25,0.04)] transition hover:border-[#123f2b] hover:shadow-[0_6px_18px_rgba(18,63,43,0.10)]";

// The first screen of the Manuscript page, like the home of Google Docs: the official manuscript, the group's other documents and a blank one to start.
export default function ManuscriptHome() {
  const router = useRouter();
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setHome(await fetchManuscriptHome());
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to open your documents."));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function createBlank() {
    setCreating(true);
    setError("");

    try {
      const created = await createGroupDocument();
      router.push(`/student/manuscript/${created.document_id}`);
    } catch (err) {
      setError(errorMessage(err, "Unable to start a new document."));
      setCreating(false);
    }
  }

  async function remove(id: number, title: string) {
    if (!window.confirm(`Delete "${title}"? Your whole group loses it and it cannot be brought back.`)) return;

    try {
      await deleteGroupDocument(id);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to delete the document."));
    }
  }

  if (!home && !error) return <p className="text-sm text-[#7b877f]">Opening your documents...</p>;

  if (!home) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </p>
    );
  }

  const official = home.official;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm text-[#7b877f]">Your group&apos;s manuscript and your other documents. Everyone in your group can open and edit them.</p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#9aa59e]">Start a new document</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" disabled={creating} onClick={() => void createBlank()} className={`${cardClass} items-start disabled:opacity-60`}>
          <span className="text-4xl font-light leading-none text-[#123f2b]">+</span>
          <span>
            <span className="block text-sm font-semibold text-[#203028]">{creating ? "Starting..." : "Blank document"}</span>
            <span className="mt-0.5 block text-xs text-[#7b877f]">A clean page to write on</span>
          </span>
        </button>
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-[#9aa59e]">Official manuscript</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/student/manuscript/official" className={cardClass}>
          <span className="text-xs font-semibold text-[#1f7a4a]">
            {official.latest_version === 0 ? "Nothing submitted yet" : `Version ${official.latest_version} submitted`}
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#203028]">Capstone manuscript</span>
            <span className="mt-0.5 block text-xs text-[#7b877f]">
              {official.saved_at ? `Edited ${formatDateTime(official.saved_at)}${official.saved_by ? ` · ${official.saved_by}` : ""}` : "Not started"}
            </span>
            <span className="mt-0.5 block text-xs text-[#7b877f]">Your adviser and the Dean can always read it</span>
          </span>
        </Link>
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-[#9aa59e]">Other documents</h2>
      {home.documents.length === 0 ? (
        <p className="mt-4 text-sm text-[#9aa59e]">No other documents yet. Press Blank document to start one: a chapter draft, notes, anything your group needs.</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {home.documents.map((doc) => (
            <div key={doc.document_id} className="relative">
              <Link href={`/student/manuscript/${doc.document_id}`} className={`${cardClass} h-full`}>
                <span className={`pr-14 text-xs font-semibold ${doc.share_adviser || doc.share_dean ? "text-[#1f7a4a]" : "text-[#7b877f]"}`}>
                  {sharedText(doc.share_adviser, doc.share_dean, home.adviser_name)}
                </span>
                <span>
                  <span className="block truncate text-sm font-semibold text-[#203028]">{doc.title}</span>
                  <span className="mt-0.5 block text-xs text-[#7b877f]">
                    Edited {formatDateTime(doc.saved_at)}
                    {doc.saved_by ? ` · ${doc.saved_by}` : ""}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void remove(doc.document_id, doc.title)}
                aria-label={`Delete ${doc.title}`}
                title="Delete"
                className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs text-[#9aa59e] hover:bg-[#fdf3f2] hover:text-[#b42318]"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
