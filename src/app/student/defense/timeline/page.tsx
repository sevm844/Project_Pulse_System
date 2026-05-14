import Link from "next/link";
import StudentShell from "../../_components/StudentShell";
import StatusBadge from "../../_components/StatusBadge";
import { defenseSchedule } from "../../_data/mockStudentData";

const timeline = [
  {
    title: "Defense requirements review",
    date: `Due ${defenseSchedule.deadline}`,
    status: "Completed",
    detail: "Manuscript, adviser approval, and required files are checked.",
  },
  {
    title: defenseSchedule.stage,
    date: `${defenseSchedule.date} - ${defenseSchedule.time}`,
    status: "Scheduled",
    detail: `Defense venue: ${defenseSchedule.venue}.`,
  },
  {
    title: "Panel remarks and revisions",
    date: "After defense",
    status: "Pending",
    detail: "Panel comments will be addressed in the document workspace.",
  },
  {
    title: "Final defense readiness",
    date: "Waiting for coordinator schedule",
    status: "Pending",
    detail: "Final defense schedule appears after revision approval.",
  },
];

export default function DefenseTimelinePage() {
  return (
    <StudentShell title="Defense Timeline">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#203028]">
              Defense Timeline
            </h2>
            <p className="mt-2 text-sm text-[#59645d]">
              Track the defense schedule, revision period, and next stage.
            </p>
          </div>
          <Link
            href="/student/defense"
            className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
          >
            Back to Defense
          </Link>
        </div>

        <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
          <div className="space-y-5">
            {timeline.map((item) => (
              <div
                key={item.title}
                className="grid gap-3 border-b border-[#edf2ec] pb-5 last:border-b-0 last:pb-0 sm:grid-cols-[160px_1fr_auto]"
              >
                <p className="text-xs font-semibold text-[#7b877f]">
                  {item.date}
                </p>
                <div>
                  <p className="text-base font-semibold text-[#203028]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-[#59645d]">{item.detail}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </StudentShell>
  );
}
