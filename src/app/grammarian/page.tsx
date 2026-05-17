import Link from "next/link";
import GrammarianShell from "./_components/GrammarianShell";
import GrammarianCalendar from "./_components/GrammarianCalendar";
import Card from "./_components/Card";
import {
  getGrammarSummary,
  grammarReviews,
} from "./_data/grammarianData";

function statusClasses(status: string) {
  if (status === "Reviewed" || status === "Issued") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "For Grammar Review" || status === "Not Issued") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function getPriorityLabel(status: string, certificateStatus: string) {
  if (status === "For Grammar Review") return "Review Needed";
  if (status === "Returned for Revision") return "Waiting Revision";
  if (certificateStatus === "Not Issued") return "Certificate Pending";
  return "Complete";
}

function priorityClasses(priority: string) {
  if (priority === "Review Needed") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === "Certificate Pending") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (priority === "Complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default function GrammarianDashboardPage() {
  const summary = getGrammarSummary();

  const activeReviews = grammarReviews.filter(
    (item) =>
      item.reviewStatus !== "Reviewed" || item.certificateStatus !== "Issued",
  );

  const issuedCertificates = grammarReviews.filter(
    (item) => item.certificateStatus === "Issued",
  );

  return (
    <GrammarianShell title="Grammarian Dashboard">
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "minmax(0, 1fr) 380px" }}
      >
        <div className="min-w-0 space-y-5">
          <Card className="overflow-x-auto border-[#bfe9c5] bg-[#f0fff4] p-4 shadow-[0_10px_30px_rgba(79,143,88,0.08)]">
            <div className="flex min-w-[820px] divide-x divide-[#bfe9c5]">
              {[
                ["For Review", summary.forReview, "Need grammar check"],
                ["Feedback Sent", summary.feedbackProvided, "With comments"],
                ["Certificates", summary.certificatesIssued, "Issued"],
                ["Returned", summary.returned, "Needs revision"],
                ["Active Files", activeReviews.length, "Open work"],
              ].map(([label, value, caption]) => (
                <div key={label} className="flex-1 px-4 py-2">
                  <p className="text-[11px] font-semibold text-[#4f6f58]">
                    {label}
                  </p>
                  <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                    <p className="text-2xl font-semibold leading-none text-[#203028]">
                      {value}
                    </p>
                    <p className="pb-0.5 text-[11px] text-[#59645d]">
                      {caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#203028]">
                  Grammar Review Workbench
                </h2>
                <p className="mt-1 text-sm text-[#7b877f]">
                  Priority view for final manuscripts, feedback, and certificate issuance.
                </p>
              </div>

              <Link
                href="/grammarian/review-queue"
                className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Open Review Queue
              </Link>
            </div>

            <div className="divide-y divide-[#edf2ec]">
              {grammarReviews.map((item) => {
                const priority = getPriorityLabel(
                  item.reviewStatus,
                  item.certificateStatus,
                );

                return (
                  <div key={item.id} className="p-5">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_190px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#203028]">
                            {item.groupName}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityClasses(
                              priority,
                            )}`}
                          >
                            {priority}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-[#59645d]">
                          {item.projectTitle}
                        </p>

                        <p className="mt-2 text-xs text-[#7b877f]">
                          {item.course} {item.section} / {item.documentTitle} /{" "}
                          Submitted {item.submittedAt}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex justify-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClasses(
                            item.reviewStatus,
                          )}`}
                        >
                          {item.reviewStatus}
                        </span>

                        <span
                          className={`inline-flex justify-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClasses(
                            item.certificateStatus,
                          )}`}
                        >
                          {item.certificateStatus}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <InfoBox label="Adviser" value={item.adviser} />
                      <InfoBox
                        label="Feedback"
                        value={item.feedback || "No feedback yet"}
                      />
                      <InfoBox
                        label="Certificate"
                        value={item.certificateNumber || item.certificateStatus}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Review Flow
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Standard path before a group can proceed to final records collection.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  ["1", "Receive Final Manuscript", "Student submits the revised manuscript for grammar checking."],
                  ["2", "Provide Grammar Feedback", "Mark corrections or confirm that the manuscript is acceptable."],
                  ["3", "Issue Certificate", "Release the grammarian certificate after the final check."],
                ].map(([step, title, detail]) => (
                  <div
                    key={step}
                    className="grid grid-cols-[34px_1fr] gap-3 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7f7d8] text-xs font-semibold text-[#203028]">
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#59645d]">
                        {detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Recent Certificates
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Latest certificate records issued by the grammarian office.
              </p>

              <div className="mt-5 space-y-3">
                {issuedCertificates.length === 0 ? (
                  <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                    No certificates issued yet.
                  </p>
                ) : (
                  issuedCertificates.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
                    >
                      <p className="text-sm font-semibold text-[#203028]">
                        {item.groupName}
                      </p>
                      <p className="mt-1 text-xs text-[#59645d]">
                        {item.certificateNumber} / {item.issuedAt}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <aside className="min-w-0 self-start sticky top-6">
          <GrammarianCalendar />
        </aside>
      </div>
    </GrammarianShell>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8faf7] p-4">
      <p className="text-xs text-[#7b877f]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#203028]">
        {value}
      </p>
    </div>
  );
}
