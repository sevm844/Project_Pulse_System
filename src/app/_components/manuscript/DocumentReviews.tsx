"use client";

import { useCallback, useEffect, useState } from "react";
import ManuscriptReview, { type ReviewSource } from "./ManuscriptReview";
import {
  addDocumentComment,
  decideDocumentReview,
  fetchDocumentReview,
  fetchDocumentReviews,
  replyToDocumentComment,
  sendDocumentForReview,
  setDocumentCommentStatus,
  type DocumentReview,
} from "../../_lib/groupDocuments";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";

type Role = "Student" | "Adviser" | "Dean";

const decisionColour = { Approved: "text-[#1f7a4a]", "Needs Changes": "text-amber-700" } as const;

// The review of one extra document. Students send a frozen copy (after sharing the document) and read the comments;
// the adviser and the Dean comment on a copy; only the adviser marks it Approved or Needs Changes.
export default function DocumentReviews({
  documentId,
  title,
  role,
  canSend = false,
  beforeSend,
  buttonClass,
}: {
  documentId: number;
  title: string;
  role: Role;
  canSend?: boolean;
  beforeSend?: () => Promise<void>;
  buttonClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<DocumentReview[] | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<DocumentReview | null>(null);
  const [deciding, setDeciding] = useState<DocumentReview | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const load = useCallback(async () => {
    try {
      setList(await fetchDocumentReviews(documentId));
    } catch (err) {
      setError(errorMessage(err, "Unable to load the reviews."));
    }
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;

    fetchDocumentReviews(documentId)
      .then((rows) => !cancelled && setList(rows))
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to load the reviews.")));

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  async function send() {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await beforeSend?.();
      await sendDocumentForReview(documentId, note);
      setNote("");
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to send the document for review."));
    }

    setBusy(false);
  }

  async function decide(review: DocumentReview, decision: "Approved" | "Needs Changes") {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await decideDocumentReview(review.review_id, decision, decisionNote);
      setDeciding(null);
      setDecisionNote("");
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to save the decision."));
    }

    setBusy(false);
  }

  const source: ReviewSource | null = reading
    ? {
        label: `${title} · copy ${reading.review_no}`,
        subtitle: `Sent by ${reading.sent_by} · ${formatDateTime(reading.sent_at)} · ${reading.word_count.toLocaleString("en-PH")} words${reading.note ? ` · "${reading.note}"` : ""}`,
        load: async () => {
          const r = await fetchDocumentReview(reading.review_id);
          return { content: r.content, comments: r.comments };
        },
        add: (body, anchor) => addDocumentComment(reading.review_id, body, anchor),
        reply: replyToDocumentComment,
        setStatus: setDocumentCommentStatus,
      }
    : null;

  const openComments = (list ?? []).reduce((sum, r) => sum + r.comments_open, 0);
  const label = list && list.length > 0 ? `Reviews (${list.length})${openComments > 0 ? ` · ${openComments} open` : ""}` : "Reviews";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass ?? "rounded-full border border-[#cfe0d3] bg-white px-5 py-2.5 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]"}
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" aria-label="Reviews of this document" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#dfe8df] px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-[#203028]">Reviews of &quot;{title}&quot;</h3>
                <p className="text-xs text-[#7b877f]">
                  {role === "Student"
                    ? "Send a copy to the Dean. He comments on the copy, and you keep writing in the document."
                    : "Each copy is frozen when the students send it. Comment on the copy; the students reply."}
                </p>
              </div>
              <button type="button" onClick={() => { setOpen(false); void load(); }} className="shrink-0 rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                Close
              </button>
            </div>

            <div className="overflow-auto px-5 py-4">
              {role === "Student" && (
                <div className="mb-4 rounded-xl border border-[#dfe8df] bg-[#f8fbf8] p-3">
                  {canSend ? (
                    <>
                      <label htmlFor="review-note" className="text-xs font-semibold text-[#203028]">Send the document as it is now</label>
                      <input
                        id="review-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        maxLength={300}
                        placeholder="A note for the reviewer (optional)"
                        className="mt-1 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:border-[#123f2b]"
                      />
                      <button type="button" disabled={busy} onClick={() => void send()} className="mt-2 rounded-full bg-[#123f2b] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                        {busy ? "Sending..." : "Send for review"}
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-[#59645d]">To send this document for review, press Share first and choose the Dean.</p>
                  )}
                </div>
              )}

              {error && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
              {list === null && !error && <p className="py-6 text-center text-sm text-[#7b877f]">Loading...</p>}
              {list && list.length === 0 && (
                <p className="py-6 text-center text-sm text-[#7b877f]">{role === "Student" ? "Nothing sent for review yet." : "The students have not sent a copy for review yet."}</p>
              )}

              <ul className="divide-y divide-[#e6eee7]">
                {(list ?? []).map((review) => (
                  <li key={review.review_id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#203028]">Copy {review.review_no}</p>
                        <p className="text-xs text-[#7b877f]">
                          Sent by {review.sent_by} · {formatDateTime(review.sent_at)} · {review.word_count.toLocaleString("en-PH")} words
                        </p>
                        {review.note && <p className="mt-0.5 text-xs text-[#59645d]">&quot;{review.note}&quot;</p>}
                        <p className="mt-0.5 text-xs">
                          <span className={review.decision ? decisionColour[review.decision] : "text-[#7b877f]"}>
                            {review.decision ? `${review.decision}${review.decided_by ? ` by ${review.decided_by}` : ""}` : "Waiting for a decision"}
                          </span>
                          <span className="text-[#7b877f]"> · {review.comments_total === 0 ? "no comments" : `${review.comments_open} open of ${review.comments_total} comments`}</span>
                        </p>
                        {review.decision === "Needs Changes" && review.decision_note && <p className="mt-0.5 text-xs text-amber-700">&quot;{review.decision_note}&quot;</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {role === "Adviser" && (
                          <button type="button" onClick={() => { setDeciding(deciding?.review_id === review.review_id ? null : review); setDecisionNote(""); }} className="rounded-full border border-[#cfe0d3] bg-white px-3 py-1.5 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                            Decide
                          </button>
                        )}
                        <button type="button" onClick={() => setReading(review)} className="rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]">
                          {role === "Student" ? "Open comments" : "Open and review"}
                        </button>
                      </div>
                    </div>

                    {deciding?.review_id === review.review_id && (
                      <div className="mt-2 rounded-lg border border-[#dfe8df] bg-[#f8fbf8] p-3">
                        <input
                          value={decisionNote}
                          onChange={(event) => setDecisionNote(event.target.value)}
                          maxLength={500}
                          aria-label="Note for the students"
                          placeholder="A note for the students (needed when asking for changes)"
                          className="w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:border-[#123f2b]"
                        />
                        <div className="mt-2 flex gap-2">
                          <button type="button" disabled={busy} onClick={() => void decide(review, "Approved")} className="rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                            Approve
                          </button>
                          <button type="button" disabled={busy} onClick={() => void decide(review, "Needs Changes")} className="rounded-full border border-amber-300 bg-white px-4 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">
                            Needs changes
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {reading && source && (
        <ManuscriptReview
          key={reading.review_id}
          source={source}
          canComment={role !== "Student"}
          onClose={() => { setReading(null); void load(); }}
          onChanged={() => void load()}
        />
      )}
    </>
  );
}
