import GrammarianShell from "../_components/GrammarianShell";
import Card from "../_components/Card";
import { grammarReviews } from "../_data/grammarianData";

export default function GrammarianFeedbackHistoryPage() {
  const feedbackItems = grammarReviews.filter((item) => item.feedback.trim());

  return (
    <GrammarianShell title="Feedback History">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#203028]">
            Grammar Feedback Records
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Feedback already provided to groups for final manuscript correction.
          </p>
        </div>

        <div className="divide-y divide-[#edf2ec]">
          {feedbackItems.map((item) => (
            <div key={item.id} className="p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-[#203028]">
                    {item.groupName}
                  </p>
                  <p className="mt-1 text-sm text-[#59645d]">
                    {item.projectTitle}
                  </p>
                  <p className="mt-2 text-xs text-[#7b877f]">
                    {item.course} {item.section} / {item.documentTitle}
                  </p>
                </div>

                <p className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Feedback Sent
                </p>
              </div>

              <p className="mt-4 rounded-xl bg-[#f8faf7] p-4 text-sm leading-6 text-[#203028]">
                {item.feedback}
              </p>
            </div>
          ))}

          {feedbackItems.length === 0 && (
            <p className="p-8 text-center text-sm text-[#7b877f]">
              No grammar feedback has been recorded yet.
            </p>
          )}
        </div>
      </Card>
    </GrammarianShell>
  );
}
