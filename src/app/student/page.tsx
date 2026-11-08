"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentShell from "./_components/StudentShell";
import StudentCalendar from "./_components/StudentCalendar";
import Card from "./_components/Card";
import { ProgressTracker } from "../_components/progress/ProgressViews";
import { useProgress } from "../_components/progress/useProgress";
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
  const progress = useProgress().items[0];

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
  const stage = group.project?.proposal_stage ?? "Title Proposal";

  const titleSummary = approvedTitle
    ? "Approved"
    : pendingTitles.length > 0
      ? `${pendingTitles.length} waiting for review`
      : titles.length > 0
        ? "Needs a new proposal"
        : "None submitted yet";

  // What the student should do next, from where the group really is (title stage first, then the defenses).
  const approvedTitles = titles.filter((item) => item.title_status === "Approved");
  const revisionTitles = titles.filter((item) => item.title_status === "Needs Revision" || item.title_status === "Rejected");
  const titleDone = progress?.phases[0]?.state === "done" || Boolean(approvedTitle);

  let nextStep = {
    heading: "Submit your title proposal",
    text: "Your adviser decides on each title you propose. Send up to 3 and she will pick the ones that go to the Dean.",
    action: "Submit Title Proposal",
    href: "/student/requirements",
  };

  if (stage === "Dean's Endorsement") {
    nextStep = {
      heading: "Waiting for the Dean",
      text: "Your adviser sent your approved titles to the Dean. The Dean will review them with your group and sign off.",
      action: "View Requirements",
      href: "/student/requirements",
    };
  } else if (stage === "Client Consultation") {
    nextStep = {
      heading: "Client consultation",
      text: "The Dean endorsed your titles. Talk with your client and your adviser, then your adviser confirms the one title you will defend.",
      action: "View Requirements",
      href: "/student/requirements",
    };
  } else if (titleDone && progress && progress.current_phase !== "Completed") {
    const current = progress.phases.find((phase) => phase.label === progress.current_phase);
    const isFinal = current?.key === "final-output";

    nextStep = {
      heading: `Next: ${progress.current_phase}`,
      text: current?.detail ?? "Follow the steps in your progress above.",
      action: isFinal ? "View Requirements" : "View Defense",
      href: isFinal ? "/student/requirements" : "/student/defense",
    };
  } else if (titleDone && progress) {
    nextStep = {
      heading: "Every phase is complete",
      text: "Your project has gone through all its phases and is archived.",
      action: "View Documents",
      href: "/student/documents",
    };
  } else if (pendingTitles.length > 0) {
    nextStep = {
      heading: "Waiting for your adviser",
      text: "Your title proposal was sent. You will see it here once your adviser approves or comments on it.",
      action: "View Requirements",
      href: "/student/requirements",
    };
  } else if (revisionTitles.length > 0 && approvedTitles.length === 0) {
    nextStep = {
      heading: "Send a new or revised title",
      text: "Your adviser asked for changes or did not approve the last proposal. Read the remarks and send another title.",
      action: "View Remarks and Resubmit",
      href: "/student/requirements",
    };
  } else if (approvedTitles.length > 0) {
    nextStep = {
      heading: "Waiting for your adviser",
      text: "Your adviser approved a title. When she is ready, she sends your approved titles to the Dean.",
      action: "View Requirements",
      href: "/student/requirements",
    };
  }

  // The first defense that already has a date.
  const scheduledDefense = progress?.phases.find((phase) => phase.detail.startsWith("Scheduled "));

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
                  : "Submit your title proposals to your adviser. Approved titles go to the Dean, and you choose the one to defend after the client consultation."}
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
                <p className="text-xs font-medium text-[#7b877f]">Current Phase</p>
                <p className="mt-2 text-sm font-semibold text-[#203028]">{progress?.current_phase ?? stage}</p>
              </div>

              <Link
                href="/student/requirements"
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
                  {scheduledDefense ? `${scheduledDefense.label} · ${scheduledDefense.detail.replace("Scheduled ", "")}` : "Not scheduled yet"}
                </p>
              </div>
            </div>
          </Card>

          {progress && (
            <Card className={emptyCardClass}>
              <h2 className="text-lg font-semibold tracking-tight text-[#203028]">Project Progress</h2>
              <div className="mt-4">
                <ProgressTracker progress={progress} />
              </div>
            </Card>
          )}

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
                href={nextStep.href}
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
