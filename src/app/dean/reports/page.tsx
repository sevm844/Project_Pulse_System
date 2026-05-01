import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import { adviserWorkloads, deanProjects } from "../_data/mockDeanData";

export default function DeanReportsPage() {
  return (
    <DeanShell title="Reports">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Project Performance
          </h2>

          <div className="mt-5 space-y-3">
            {deanProjects.map((project) => (
              <div key={project.id} className="rounded-xl bg-[#f8faf7] p-4">
                <p className="text-sm font-semibold text-[#203028]">
                  {project.groupName}
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  {project.progress}% progress • {project.revisionCount}{" "}
                  revisions • {project.feedbackCompletion}% feedback completion
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Adviser Workload Report
          </h2>

          <div className="mt-5 space-y-3">
            {adviserWorkloads.map(([name, groups, pending]) => (
              <div key={name} className="rounded-xl bg-[#f8faf7] p-4">
                <p className="text-sm font-semibold text-[#203028]">{name}</p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  {groups} groups handled • {pending} pending reviews
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DeanShell>
  );
}
