import Link from "next/link";
import StudentShell from "./_components/StudentShell";
import Card from "./_components/Card";
import StatusBadge from "./_components/StatusBadge";
import {
  activities,
  defenseSchedule,
  documents,
  feedbackItems,
  members,
  project,
  tasks,
} from "./_data/mockStudentData";

export default function StudentDashboardPage() {
  const pendingFeedback = feedbackItems.filter(
    (item) => item.status === "Pending",
  );

  const upcomingTasks = tasks.slice(0, 3);
  const recentActivities = activities.slice(0, 4);

  return (
    <StudentShell title="Dashboard" subtitle="Student Management">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] bg-white/80 p-6">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f8f58]">
                  Student Dashboard
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-[#203028]">
                    {project.title}
                  </h1>
                  <span className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-xs font-semibold text-[#59645d]">
                    {project.groupName}
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59645d]">
                  Track your project status, document submissions, adviser
                  feedback, deadlines, defense schedule, and group progress.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                    Group Code: {project.groupCode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid divide-y divide-[#edf2ec] md:grid-cols-4 md:divide-x md:divide-y-0">
            <div className="p-5">
              <p className="text-xs font-medium text-[#7b877f]">Adviser</p>
              <p className="mt-2 text-sm font-semibold text-[#203028]">
                {project.adviser}
              </p>
            </div>

            <Link
              href="/student/defense"
              className="p-5 transition hover:bg-[#fbfdfb]"
            >
              <p className="text-xs font-medium text-[#7b877f]">
                Current Stage
              </p>
              <p className="mt-2 text-sm font-semibold text-[#203028]">
                {project.stage}
              </p>
            </Link>

            <Link
              href="/student/feedback?filter=pending"
              className="p-5 transition hover:bg-[#fbfdfb]"
            >
              <p className="text-xs font-medium text-[#7b877f]">
                Pending Feedback
              </p>
              <p className="mt-2 text-sm font-semibold text-[#203028]">
                {pendingFeedback.length} unresolved
              </p>
            </Link>

            <Link
              href="/student/defense"
              className="p-5 transition hover:bg-[#fbfdfb]"
            >
              <p className="text-xs font-medium text-[#7b877f]">
                Upcoming Defense
              </p>
              <p className="mt-2 text-sm font-semibold text-[#203028]">
                {defenseSchedule.date}
              </p>
            </Link>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
                  Stage Progress
                </h2>
                <p className="mt-1 text-sm text-[#7b877f]">
                  {project.stage} preparation progress
                </p>
              </div>
              <span className="text-sm font-semibold text-[#4f8f58]">
                {project.completion}%
              </span>
            </div>

            <div className="mt-5 h-2 rounded-full bg-[#edf2ec]">
              <div
                className="h-2 rounded-full bg-[#94d29a]"
                style={{ width: `${project.completion}%` }}
              />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {project.chapters.map((chapter) => (
                <Link
                  key={chapter.title}
                  href="/student/documents"
                  className="rounded-xl border border-[#dfe8df] bg-[#f8faf7] p-4 transition hover:bg-[#eff6ee]"
                >
                  <p className="text-sm font-semibold text-[#203028]">
                    {chapter.title}
                  </p>
                  <div className="mt-3">
                    <StatusBadge status={chapter.status} />
                  </div>
                  <p className="mt-3 text-xs text-[#7b877f]">
                    {chapter.progress}% complete
                  </p>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
              Group Members
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Project team and assigned roles
            </p>

            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <div
                  key={member.email}
                  className="rounded-xl bg-[#f8faf7] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[#203028]">
                    {member.name}
                  </p>
                  <p className="text-xs text-[#7b877f]">
                    {member.role} • {member.email}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="p-5">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
              Upcoming Deadlines
            </h2>

            <div className="mt-4 space-y-3">
              {upcomingTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/student/checklist"
                  className="block rounded-xl bg-[#f8faf7] px-4 py-3 transition hover:bg-[#eff6ee]"
                >
                  <p className="text-sm font-medium text-[#203028]">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Due {task.deadline}
                  </p>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
              Defense Schedule
            </h2>

            <Link
              href="/student/defense"
              className="mt-4 block rounded-xl bg-[#f8faf7] px-4 py-4 transition hover:bg-[#eff6ee]"
            >
              <p className="text-sm font-semibold text-[#203028]">
                {defenseSchedule.stage}
              </p>
              <p className="mt-1 text-xs text-[#7b877f]">
                {defenseSchedule.date} • {defenseSchedule.time}
              </p>
              <p className="mt-1 text-xs text-[#7b877f]">
                {defenseSchedule.venue}
              </p>
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
              Recent Activity
            </h2>

            <div className="mt-4 space-y-3">
              {recentActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="block rounded-xl bg-[#f8faf7] px-4 py-3 transition hover:bg-[#eff6ee]"
                >
                  <p className="text-sm font-medium text-[#203028]">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {activity.date}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
                Document Summary
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Latest document versions and review states
              </p>
            </div>
            <Link
              href="/student/documents"
              className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] transition hover:bg-[#f3f7f1]"
            >
              View All Documents
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-3 py-3 font-medium">Document</th>
                  <th className="px-3 py-3 font-medium">Version</th>
                  <th className="px-3 py-3 font-medium">Updated</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ec]">
                {documents.slice(0, 4).map((document) => (
                  <tr key={document.id}>
                    <td className="px-3 py-4 font-medium text-[#203028]">
                      {document.type}
                    </td>
                    <td className="px-3 py-4 text-[#59645d]">
                      {document.version}
                    </td>
                    <td className="px-3 py-4 text-[#59645d]">
                      {document.updated}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={document.status} />
                    </td>
                    <td className="px-3 py-4 text-[#59645d]">
                      {document.reviewer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
