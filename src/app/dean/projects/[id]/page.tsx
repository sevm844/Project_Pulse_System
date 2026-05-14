import Link from "next/link";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import StatusBadge from "../../_components/StatusBadge";
import {
  chapterProgress,
  deanProjects,
  revisionHistory,
} from "../../_data/mockDeanData";

function getReadinessItems(project: (typeof deanProjects)[number]) {
  return [
    ["Revision Count", project.revisionCount],
    ["Feedback Completion", `${project.feedbackCompletion}%`],
    ["Defense Outcome", project.defenseOutcome],
    ["Final Requirements", project.finalRequirementStatus],
  ];
}

function getProgressColor(progress: number) {
  if (progress >= 90) return "bg-[#4f8f58]";
  if (progress >= 60) return "bg-[#94d29a]";
  return "bg-amber-400";
}

export default async function DeanProjectProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = deanProjects.find((item) => item.id === Number(id));

  if (!project) {
    return (
      <DeanShell title="Project Profile">
        <Card className="p-6">
          <p className="text-sm text-[#7b877f]">Project not found.</p>
        </Card>
      </DeanShell>
    );
  }

  return (
    <DeanShell title="Project Profile">
      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-tight text-[#203028]">
                  {project.projectTitle}
                </h2>
                <StatusBadge status={project.riskLevel} />
              </div>

              <p className="mt-3 text-sm text-[#59645d]">
                {project.course} {project.section} • {project.groupName} •
                Adviser: {project.adviser}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dean/messages"
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
              >
                Message Group
              </Link>

              <Link
                href="/dean/approvals"
                className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Review Final Output
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Stage", project.stage],
            ["Progress", `${project.progress}%`],
            ["Feedback", `${project.feedbackCompletion}%`],
            ["Final", project.finalRequirementStatus],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-lg font-semibold text-[#203028]">
                {value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Manuscript Progress
            </h3>

            <div className="mt-5 space-y-5">
              {chapterProgress.map(([chapter, status, progress]) => (
                <div key={chapter}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#203028]">
                      {chapter}
                    </p>
                    <StatusBadge status={String(status)} />
                  </div>

                  <div className="h-2 rounded-full bg-[#edf2ec]">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        Number(progress),
                      )}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Readiness Snapshot
            </h3>

            <div className="mt-5 grid gap-3">
              {getReadinessItems(project).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-xs text-[#7b877f]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#203028]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Revision History
            </h3>

            <div className="mt-4 space-y-3">
              {revisionHistory.map((revision) => (
                <div key={revision.id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {revision.version} • {revision.chapter}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Edited by {revision.editedBy} on {revision.editedAt}
                  </p>
                  <p className="mt-2 text-sm text-[#59645d]">
                    {revision.note}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Executive Focus
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-[#f8faf7] p-4">
                <p className="text-xs text-[#7b877f]">Risk Level</p>
                <div className="mt-2">
                  <StatusBadge status={project.riskLevel} />
                </div>
              </div>

              <div className="rounded-xl bg-[#f8faf7] p-4">
                <p className="text-xs text-[#7b877f]">Defense Outcome</p>
                <p className="mt-2 font-semibold text-[#203028]">
                  {project.defenseOutcome}
                </p>
              </div>

              <div className="rounded-xl bg-[#f8faf7] p-4">
                <p className="text-xs text-[#7b877f]">Recommended Action</p>
                <p className="mt-2 leading-6 text-[#59645d]">
                  {project.riskLevel === "At Risk"
                    ? "Request adviser update and monitor pending revisions."
                    : project.finalRequirementStatus !== "Complete"
                      ? "Track final requirement completion before approval."
                      : "Continue monitoring until final archiving is complete."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DeanShell>
  );
}
