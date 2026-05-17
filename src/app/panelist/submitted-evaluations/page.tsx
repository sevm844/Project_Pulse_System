import PanelistShell from "../_components/PanelistShell";
import Card from "../_components/Card";
import { panelistDefenses, computeAverage } from "../_data/panelistData";

export default function SubmittedEvaluationsPage() {
  const submitted = panelistDefenses.filter(
    (item) => item.evaluationStatus === "Submitted",
  );

  return (
    <PanelistShell title="Submitted Evaluations">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#203028]">
            Evaluation History
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Submitted panel evaluations for defense records.
          </p>
        </div>

        <div className="divide-y divide-[#edf2ec]">
          {submitted.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
              No submitted evaluations yet.
            </p>
          ) : (
            submitted.map((defense) => (
              <div
                key={defense.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-[#203028]">
                    {defense.groupName}
                  </p>
                  <p className="mt-1 text-sm text-[#59645d]">
                    {defense.projectTitle}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Submitted {defense.submittedAt}
                  </p>
                </div>

                <p className="text-sm text-[#59645d]">{defense.remarks}</p>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Average {computeAverage(defense)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </PanelistShell>
  );
}
