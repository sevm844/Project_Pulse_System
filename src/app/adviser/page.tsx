import Link from "next/link";
import AdviserShell from "./_components/AdviserShell";
import AdviserCalendar from "./_components/AdviserCalendar";
import Card from "./_components/Card";
import StatusBadge from "./_components/StatusBadge";
import {
  assignedGroups,
  defenseEndorsements,
  recentSubmissions,
  reviewQueue,
} from "./_data/mockAdviserData";

export default function AdviserDashboardPage() {
  const pendingReviews = reviewQueue.filter(
    (review) => review.status === "Pending",
  );

  const unverifiedRevisions = reviewQueue.filter(
    (review) => review.status === "Needs Revision",
  );

  const pendingEndorsements = defenseEndorsements.filter(
    (defense) => defense.status === "Pending",
  );

  const courseSections = assignedGroups.reduce<
    Record<string, typeof assignedGroups>
  >((groups, item) => {
    const key = `${item.course} ${item.section}`;
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <AdviserShell title="Dashboard">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          {/* Overview */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Assigned Groups",
                assignedGroups.length,
                "/adviser/assigned-groups",
              ],
              ["Pending Reviews", pendingReviews.length, "/adviser/reviews"],
              [
                "Unverified Revisions",
                unverifiedRevisions.length,
                "/adviser/feedback-queue",
              ],
              [
                "Defense Endorsements",
                pendingEndorsements.length,
                "/adviser/defense",
              ],
            ].map(([label, value, href]) => (
              <Link key={label} href={String(href)}>
                <Card className="p-5 transition hover:bg-[#fbfdfb]">
                  <p className="text-xs font-medium text-[#7b877f]">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#203028]">
                    {value}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Course and section grouping */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Assigned Groups by Course and Section
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Groups are organized from coordinator-assigned academic records.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {Object.entries(courseSections).map(([section, groups]) => (
                <div key={section} className="rounded-xl bg-[#f8faf7] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#203028]">
                      {section}
                    </h3>
                    <span className="text-xs text-[#7b877f]">
                      {groups.length} group{groups.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {groups.map((group) => (
                      <Link
                        key={group.id}
                        href="/adviser/assigned-groups"
                        className="block rounded-lg bg-white px-3 py-3 transition hover:bg-[#eff6ee]"
                      >
                        <p className="text-sm font-medium text-[#203028]">
                          {group.groupName}
                        </p>
                        <p className="mt-1 text-xs text-[#7b877f]">
                          {group.projectTitle}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Review queue */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#edf2ec] p-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#203028]">
                    Review Queue
                  </h2>
                  <p className="mt-1 text-sm text-[#7b877f]">
                    Latest documents waiting for adviser action.
                  </p>
                </div>

                <Link
                  href="/adviser/reviews"
                  className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  View Reviews
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                    <tr>
                      <th className="px-5 py-3 font-medium">
                        Course / Section
                      </th>
                      <th className="px-5 py-3 font-medium">Group</th>
                      <th className="px-5 py-3 font-medium">Document</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf2ec]">
                    {reviewQueue.map((review) => (
                      <tr key={review.id}>
                        <td className="px-5 py-4 text-[#59645d]">
                          {review.course} {review.section}
                        </td>
                        <td className="px-5 py-4 font-medium text-[#203028]">
                          {review.groupName}
                        </td>
                        <td className="px-5 py-4 text-[#59645d]">
                          {review.documentTitle}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={review.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recent submissions */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Recent Student Submissions
              </h2>

              <div className="mt-4 space-y-3">
                {recentSubmissions.map((submission) => (
                  <Link
                    key={submission.id}
                    href={submission.href}
                    className="block rounded-xl bg-[#f8faf7] p-4 transition hover:bg-[#eff6ee]"
                  >
                    <p className="text-sm font-medium text-[#203028]">
                      {submission.title}
                    </p>
                    <p className="mt-1 text-xs text-[#7b877f]">
                      {submission.meta} • {submission.date}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Calendar */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <AdviserCalendar />
        </div>
      </div>
    </AdviserShell>
  );
}
