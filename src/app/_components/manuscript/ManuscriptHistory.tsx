"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import ManuscriptView from "./ManuscriptView";
import { errorMessage } from "../../_lib/groups";
import {
  fetchManuscriptVersion,
  fetchManuscriptVersions,
  type ManuscriptVersion,
} from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

// Every frozen version of a group's manuscript: who saved it, when, and who edited it. Open one to read it as it was.
// Students can also take an older version back as their draft.
export default function ManuscriptHistory({
  projectId,
  reloadKey = 0,
  onUseAsDraft,
}: {
  projectId: number;
  reloadKey?: number;
  onUseAsDraft?: (content: JSONContent, versionNo: number) => void;
}) {
  const [versions, setVersions] = useState<ManuscriptVersion[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<(ManuscriptVersion & { content: JSONContent }) | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const load = useCallback(async () => {
    try {
      setVersions(await fetchManuscriptVersions(projectId));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the version history."));
    }
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, reloadKey]);

  async function view(versionNo: number) {
    setOpening(versionNo);
    setError("");

    try {
      setOpen(await fetchManuscriptVersion(projectId, versionNo));
      setConfirmRestore(false);
    } catch (err) {
      setError(errorMessage(err, "Unable to open this version."));
    }

    setOpening(null);
  }

  if (versions === null && !error) return <p className="text-sm text-[#7b877f]">Loading versions...</p>;

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {versions && versions.length === 0 && (
        <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">No version has been submitted yet.</p>
      )}

      <ol className="space-y-3">
        {(versions ?? []).map((version) => {
          const others = version.editors.filter((name) => name !== version.saved_by);

          return (
            <li key={version.version_no} className="rounded-xl border border-[#edf2ec] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#203028]">Version {version.version_no}</p>
                  <p className="mt-0.5 text-xs text-[#59645d]">
                    {version.saved_by ?? "Unknown"} · {formatDateTime(version.saved_at)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7b877f]">
                    {version.word_count.toLocaleString("en-PH")} words
                    {others.length > 0 && ` · also edited by ${others.join(", ")}`}
                  </p>
                  {version.note && <p className="mt-1.5 break-words text-xs italic text-[#59645d]">&ldquo;{version.note}&rdquo;</p>}
                </div>
                <button
                  type="button"
                  disabled={opening !== null}
                  onClick={() => void view(version.version_no)}
                  className="shrink-0 rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-60"
                >
                  {opening === version.version_no ? "Opening..." : "View"}
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-label={`Manuscript version ${open.version_no}`} className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf2ec] px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[#203028]">Version {open.version_no}</h3>
                <p className="mt-0.5 text-xs text-[#59645d]">
                  Saved by {open.saved_by ?? "Unknown"} · {formatDateTime(open.saved_at)} · {open.word_count.toLocaleString("en-PH")} words
                </p>
                {open.editors.length > 0 && <p className="mt-0.5 text-[11px] text-[#7b877f]">Edited by {open.editors.join(", ")}</p>}
                {open.note && <p className="mt-1 text-xs italic text-[#59645d]">&ldquo;{open.note}&rdquo;</p>}
              </div>
              <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                Close
              </button>
            </div>

            <ManuscriptView content={open.content} />

            {onUseAsDraft && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#edf2ec] px-5 py-3">
                {confirmRestore ? (
                  <>
                    <p className="mr-auto text-xs text-[#59645d]">
                      Your current draft will be replaced. Submit it as a version first if you want to keep it.
                    </p>
                    <button type="button" onClick={() => setConfirmRestore(false)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUseAsDraft(open.content, open.version_no);
                        setOpen(null);
                      }}
                      className="rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
                    >
                      Replace my draft
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmRestore(true)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                    Use this version as my draft
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
