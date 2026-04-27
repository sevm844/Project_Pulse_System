import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import { defenseSchedule } from "../_data/mockStudentData";

export default function DefensePage() {
  return (
    <StudentShell title="Defense">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Defense</h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Track schedules, panelists, required files, results, remarks, and
            score summaries for defense stages.
          </p>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Current Defense Stage
            </h3>

            <div className="mt-5 rounded-2xl bg-[#f8faf7] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#4f8f58]">
                {defenseSchedule.stage}
              </p>
              <h4 className="mt-2 text-2xl font-semibold tracking-tight">
                {defenseSchedule.date} • {defenseSchedule.time}
              </h4>
              <p className="mt-2 text-sm text-[#59645d]">
                {defenseSchedule.venue} • College of Information and
                Communication Technology
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {defenseSchedule.panelists.map((panelist) => (
                  <div key={panelist} className="rounded-xl bg-white p-4">
                    <p className="text-sm font-semibold text-[#203028]">
                      {panelist}
                    </p>
                    <p className="text-xs text-[#7b877f]">Panelist</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Required Files
            </h3>

            <div className="mt-4 space-y-3">
              {[
                "Revised manuscript PDF",
                "Monitoring form",
                "Presentation slides",
                "Adviser endorsement",
              ].map((file) => (
                <div key={file} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-medium text-[#203028]">{file}</p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Required before {defenseSchedule.deadline}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Result / Remarks
            </h3>
            <div className="mt-4 rounded-xl bg-[#f8faf7] p-4">
              <p className="text-sm text-[#59645d]">
                No official result yet. Panel remarks will appear here after the
                defense evaluation is encoded.
              </p>
            </div>
            <button className="mt-4 rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
              Download Evaluation Result
            </button>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Score Summary
            </h3>

            <div className="mt-4 space-y-3">
              {["Documentation", "Presentation", "System Prototype"].map(
                (criteria) => (
                  <div key={criteria}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-[#203028]">
                        {criteria}
                      </span>
                      <span className="text-[#7b877f]">Pending</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#edf2ec]" />
                  </div>
                ),
              )}
            </div>
          </Card>
        </div>
      </div>
    </StudentShell>
  );
}
