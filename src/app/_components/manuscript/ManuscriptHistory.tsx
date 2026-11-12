"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ManuscriptCompare from "./ManuscriptCompare";
import ManuscriptExportDialog from "./ManuscriptExportDialog";
import ManuscriptReview from "./ManuscriptReview";
import ManuscriptView from "./ManuscriptView";
import { errorMessage, type ApiGroup } from "../../_lib/groups";
import {
  fetchManuscriptComments,
  fetchManuscriptVersion,
  fetchManuscriptVersions,
  type ManuscriptComment,
  type ManuscriptVersion,
} from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

// Every frozen version of a group's manuscript: who saved it, when, and who edited it. Open one to read it as it was.
// Students can also take an older version back as their draft.
export default function ManuscriptHistory({
  projectId,
  reloadKey = 0,
  onUseAsDraft,
  canReview = false,
  group,
}: {
  projectId: number;
  reloadKey?: number;
  onUseAsDraft?: (content: JSONContent, versionNo: number) => void;
  // The adviser and the Dean write review comments; students only read and reply.
  canReview?: boolean;
  // Fills in the title page when a version is downloaded. Students do not pass it: their own group is loaded.
  group?: ApiGroup | null;
}) {
  const [versions, setVersions] = useState<ManuscriptVersion[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<(ManuscriptVersion & { content: JSONContent }) | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  // Comparing needs two versions; `to` is the one the comparison opens on (the one before it is the older side).
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const [reviewNo, setReviewNo] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [comments, setComments] = useState<ManuscriptComment[]>([]);

  const load = useCallback(async () => {
    try {
      setVersions(await fetchManuscriptVersions(projectId));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the version history."));
    }

    // The comment counts are a convenience: the list still works if they cannot be loaded.
    try {
      setComments(await fetchManuscriptComments(projectId));
    } catch {
      setComments([]);
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

      {versions && versions.length >= 2 && (
        <button
          type="button"
          onClick={() => setCompareTo(Math.max(...versions.map((v) => v.version_no)))}
          className="mb-3 w-full rounded-xl border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-2 text-sm font-semibold text-[#123f2b] hover:bg-[#e8f1ea]"
        >
          Compare versions
        </button>
      )}

      <ol className="space-y-3">
        {(versions ?? []).map((version) => {
          const others = version.editors.filter((name) => name !== version.saved_by);
          const mine = comments.filter((c) => c.version_no === version.version_no);
          const openCount = mine.filter((c) => c.status === "Open").length;
          const hasPrevious = (versions ?? []).some((v) => v.version_no < version.version_no);

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
                  {mine.length > 0 && (
                    <p className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${openCount > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {openCount > 0 ? `${openCount} open ${openCount === 1 ? "comment" : "comments"}` : `${mine.length} ${mine.length === 1 ? "comment" : "comments"} resolved`}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    type="button"
                    disabled={opening !== null}
                    onClick={() => void view(version.version_no)}
                    className="rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-60"
                  >
                    {opening === version.version_no ? "Opening..." : "View"}
                  </button>
                  {(canReview || mine.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setReviewNo(version.version_no)}
                      className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      {canReview ? "Review" : "Comments"}
                    </button>
                  )}
                  {hasPrevious && (
                    <button
                      type="button"
                      onClick={() => setCompareTo(version.version_no)}
                      title="See what changed since the version before this one"
                      className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]"
                    >
                      Compare
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {compareTo !== null && versions && versions.length >= 2 && (
        <ManuscriptCompare projectId={projectId} versions={versions} initialTo={compareTo} onClose={() => setCompareTo(null)} />
      )}

      {downloading && open && (
        <ManuscriptExportDialog
          projectId={projectId}
          group={group}
          loadMyGroup={!group && Boolean(onUseAsDraft)}
          label={`Version ${open.version_no}`}
          getContent={() => open.content}
          onClose={() => setDownloading(false)}
        />
      )}

      {reviewNo !== null && (
        <ManuscriptReview
          projectId={projectId}
          versionNo={reviewNo}
          version={versions?.find((v) => v.version_no === reviewNo)}
          canComment={canReview}
          onClose={() => setReviewNo(null)}
          onChanged={() => void load()}
        />
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
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
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => setDownloading(true)} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-1.5 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                  Download
                </button>
                <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                  Close
                </button>
              </div>
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
        </div>,
        document.body,
      )}
    </div>
  );
}
