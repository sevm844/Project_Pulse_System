"use client";

import { useMemo, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  courses,
  reviewQueue,
  sections,
  type CourseCode,
  type GroupStage,
  type ReviewItem,
} from "../_data/mockAdviserData";

const stages: GroupStage[] = [
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(reviewQueue);
  const [selected, setSelected] = useState<ReviewItem>(reviewQueue[0]);

  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState<"All" | GroupStage>("All");

  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesCourse = course === "All" || review.course === course;
      const matchesSection = section === "All" || review.section === section;
      const matchesStage = stage === "All" || review.stage === stage;

      return matchesCourse && matchesSection && matchesStage;
    });
  }, [course, section, stage, reviews]);

  function updateStatus(status: ReviewItem["status"]) {
    setReviews((current) =>
      current.map((review) =>
        review.id === selected.id ? { ...review, status } : review,
      ),
    );

    setSelected((current) => ({ ...current, status }));
    setRejectReason("");
  }

  function addComment() {
    const nextComment = comment.trim();
    if (!nextComment) return;

    const nextReview: ReviewItem = {
      ...selected,
      comments: [...selected.comments, nextComment],
      status: "Needs Revision",
    };

    setReviews((current) =>
      current.map((review) =>
        review.id === selected.id ? nextReview : review,
      ),
    );

    setSelected(nextReview);
    setComment("");
  }

  return (
    <AdviserShell title="Reviews">
      <div className="space-y-5">
        {/* Filters */}
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Course
              </label>
              <select
                value={course}
                onChange={(e) =>
                  setCourse(e.target.value as "All" | CourseCode)
                }
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {courses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {sections.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as "All" | GroupStage)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {stages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          {/* Review queue */}
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Review Queue
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Select a submission by course, section, or stage.
              </p>
            </div>

            <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">
              {filteredReviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => setSelected(review)}
                  className={`w-full rounded-xl p-4 text-left transition ${
                    selected.id === review.id
                      ? "bg-[#d7f7d8]"
                      : "bg-[#f8faf7] hover:bg-[#eff6ee]"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#4f8f58]">
                      {review.course} {review.section}
                    </p>
                    <StatusBadge status={review.status} />
                  </div>

                  <p className="text-sm font-semibold text-[#203028]">
                    {review.groupName}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {review.documentTitle}
                  </p>
                  <p className="mt-2 text-xs text-[#7b877f]">
                    {review.stage} • {review.version}
                  </p>
                </button>
              ))}

              {filteredReviews.length === 0 && (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  No reviews found for the selected filters.
                </p>
              )}
            </div>
          </Card>

          {/* Review workspace */}
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-[#203028]">
                      {selected.documentTitle}
                    </h2>
                    <StatusBadge status={selected.status} />
                  </div>

                  <p className="mt-2 text-sm text-[#7b877f]">
                    {selected.course} {selected.section} • {selected.groupName}{" "}
                    • {selected.stage}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {selected.version} • Submitted {selected.submittedAt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus("Approved")}
                    className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus("Needs Revision")}
                    className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                  >
                    Request Revision
                  </button>
                </div>
              </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              {/* Document preview */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#203028]">
                  Document Viewer
                </h3>

                <div className="mt-5 min-h-[520px] rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-6 text-sm leading-7 text-[#59645d]">
                  <p className="font-semibold text-[#203028]">
                    {selected.projectTitle}
                  </p>
                  <p className="mt-4">
                    This area represents the submitted manuscript viewer. In the
                    deployed system, this should render the uploaded file or the
                    built-in editor version selected by the adviser.
                  </p>
                  <p className="mt-4">
                    Advisers can highlight a paragraph, add comments, compare
                    previous versions, and approve or request revisions.
                  </p>
                </div>
              </Card>

              <aside className="space-y-5">
                {/* Comments */}
                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-[#203028]">
                    Comment Sidebar
                  </h3>

                  <div className="mt-4 space-y-3">
                    {selected.comments.length === 0 ? (
                      <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                        No comments added yet.
                      </p>
                    ) : (
                      selected.comments.map((item, index) => (
                        <div key={index} className="rounded-xl bg-[#f8faf7] p-4">
                          <p className="text-sm text-[#59645d]">{item}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add adviser comment..."
                    className="mt-4 min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <button
                    type="button"
                    onClick={addComment}
                    className="mt-3 w-full rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Add Comment
                  </button>
                </Card>

                {/* Reject */}
                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-[#203028]">
                    Reject Submission
                  </h3>

                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason is required before rejecting."
                    className="mt-4 min-h-20 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (rejectReason.trim()) updateStatus("Rejected");
                    }}
                    className="mt-3 w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Reject
                  </button>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </AdviserShell>
  );
}
