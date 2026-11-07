"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentShell from "./_components/StudentShell";
import StudentCalendar from "./_components/StudentCalendar";
import Card from "./_components/Card";
import { apiFetch } from "../_lib/api";
import {
  errorMessage,
  fetchMyGroup,
  NO_TITLE_YET,
  type ApiGroup,
  type ApiTitleSubmission,
} from "../_lib/groups";

const emptyCardClass =
  "border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)]";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [titles, setTitles] = useState<ApiTitleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const myGroup = await fetchMyGroup();
        if (cancelled) return;

        // No group yet, or the invitation is not accepted: back to setup.
        if (!myGroup || !myGroup.my_membership?.accepted_at) {
          router.replace("/student/setup");
          return;
        }

        setGroup(myGroup);

        if (myGroup.project) {
          const submissions = await apiFetch<ApiTitleSubmission[]>(
            `/projects/${myGroup.project.project_id}/titles`,
          );
          if (!cancelled) setTitles(submissions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err, "Unable to load your dashboard."));
        }
      }

      if (!cancelled) setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !group) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-[#1f2a24]">
        <p className={`text-sm ${error ? "text-[#b42318]" : "text-[#7b877f]"}`}>
          {error || "Checking student group..."}
        </p>
      </main>
    );
  }

  const approvedTitle = group.project?.project_title || null;
  const pendingTitles = titles.filter((item) => item.title_status === "Pending");
  const rejectedTitles = titles.filter((item) => item.title_status === "Rejected");
  const stage = group.project?.current_stage || "Proposal Defense";

  const titleSummary = approvedTitle
    ? "Approved"
    : pendingTitles.length > 0
      ? `${pendingTitles.length} waiting for review`
      : titles.length > 0
        ? "Needs a new proposal"
        : "None submitted yet";

  let nextStep = {
    heading: "Submit your title proposal",
    text: "Your adviser has to approve a project title before you can continue. Submit one or more proposed titles for review.",
    action: "Submit Title Proposal",
  };

  if (approvedTitle) {
    nextStep = {
      heading: "Your title is approved",
      text: "Your project title is final. More project tools will appear here as your adviser and coordinator publish them.",
      action: "View My Project",
    };
  } else if (pendingTitles.length > 0) {
    nextStep = {
      heading: "Waiting for your adviser",
      text: "Your title proposal was sent. You will see it here once your adviser approves or comments on it.",
      action: "View Title Proposals",
    };
  } else if (rejectedTitles.length > 0) {
    nextStep = {
      heading: "Submit a revised title",
      text: "Your adviser did not approve the last proposal. Read the remarks and send a new title.",
      action: "View Remarks and Resubmit",
    };
  }

  return (
    <StudentShell title="Student Overview" subtitle="Student Management">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-[#dfe8df] bg-white shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
            <div className="border-b border-[#edf2ec] bg-[#fbfdfb] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f8f58]">
                Student Dashboard
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1
                  className={`text-3xl font-semibold tracking-tight ${
                    approvedTitle ? "text-[#203028]" : "text-[#7b877f]"
                  }`}
                >
                  {approvedTitle || NO_TITLE_YET}
                </h1>

                <span className="rounded-full border border-[#dfe8df] bg-[#f6fbf4] px-3 py-1 text-xs font-semibold text-[#59645d]">
                  {group.group_name}
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59645d]">
                {approvedTitle
                  ? "Track your project status and group details here."
                  : "Submit your title proposals to your adviser. Once one is approved, it becomes your official project title."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                  Group Code: {group.group_code}
                </span>
                <span className="rounded-full border border-[#dfe8df] bg-[#f6fbf4] px-3 py-1.5 font-semibold text-[#59645d]">
                  {group.course} {group.section}
                </span>
                {group.school_year && (
                  <span className="rounded-full border border-[#dfe8df] bg-[#f6fbf4] px-3 py-1.5 font-semibold text-[#59645d]">
                    {group.school_year}
                    {group.semester ? ` / ${group.semester}` : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="grid divide-y divide-[#edf2ec] bg-white md:grid-cols-4 md:divide-x md:divide-y-0">
              <div className="p-5">
                <p className="text-xs font-medium text-[#7b877f]">Adviser</p>
                <p className="mt-2 text-sm font-semibold text-[#203028]">
                  {group.adviser?.name || "Not assigned"}
                </p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-[#7b877f]">Current Stage</p>
                <p className="mt-2 text-sm font-semibold text-[#203028]">{stage}</p>
              </div>

              <Link
                href="/student/project"
                className="p-5 transition hover:bg-[#fbfdfb]"
              >
                <p className="text-xs font-medium text-[#7b877f]">Title Proposals</p>
                <p className="mt-2 text-sm font-semibold text-[#203028]">
                  {titleSummary}
                </p>
              </Link>

              <div className="p-5">
                <p className="text-xs font-medium text-[#7b877f]">Upcoming Defense</p>
                <p className="mt-2 text-sm font-semibold text-[#203028]">
                  Not scheduled yet
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <Card className={emptyCardClass}>
              <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
                Next Step
              </h2>
              <p className="mt-4 text-sm font-semibold text-[#203028]">
                {nextStep.heading}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#59645d]">
                {nextStep.text}
              </p>
              <Link
                href="/student/project"
                className="mt-5 inline-block rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
              >
                {nextStep.action}
              </Link>
            </Card>

            <Card className={emptyCardClass}>
              <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
                Group Members
              </h2>

              <p className="mt-1 text-sm text-[#7b877f]">
                Project team and assigned roles
              </p>

              <div className="mt-4 space-y-3">
                {group.members.map((member) => (
                  <div
                    key={member.member_id}
                    className="rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[#203028]">
                      {member.name}
                    </p>

                    <p className="text-xs text-[#7b877f]">
                      {member.role_in_group} •{" "}
                      {member.accepted_at ? "Accepted" : "Invitation pending"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className={emptyCardClass}>
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
              Deadlines, Defense Schedule and Activity
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#7b877f]">
              Nothing here yet. Deadlines, your defense schedule, adviser
              feedback and recent activity will appear once they are published.
            </p>
          </Card>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <StudentCalendar />
        </div>
      </div>
    </StudentShell>
  );
}
