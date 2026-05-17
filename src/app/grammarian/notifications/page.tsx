import GrammarianShell from "../_components/GrammarianShell";
import Card from "../_components/Card";
import { grammarReviews } from "../_data/grammarianData";

export default function GrammarianNotificationsPage() {
  const notifications = [
    ...grammarReviews
      .filter((item) => item.reviewStatus === "For Grammar Review")
      .map((item) => ({
        title: `${item.groupName} submitted a manuscript for grammar review.`,
        detail: `${item.documentTitle} / ${item.course} ${item.section}`,
        status: "Review Needed",
      })),
    ...grammarReviews
      .filter((item) => item.certificateStatus === "Issued")
      .map((item) => ({
        title: `${item.groupName} certificate was issued.`,
        detail: `${item.certificateNumber} / ${item.issuedAt}`,
        status: "Completed",
      })),
  ];

  return (
    <GrammarianShell title="Notifications">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#203028]">
            Grammarian Notifications
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Alerts for manuscript review, feedback, and certificate activity.
          </p>
        </div>

        <div className="divide-y divide-[#edf2ec]">
          {notifications.map((item) => (
            <div key={`${item.title}-${item.detail}`} className="p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#203028]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">{item.detail}</p>
                </div>

                <span className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-xs font-semibold text-[#59645d]">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </GrammarianShell>
  );
}
