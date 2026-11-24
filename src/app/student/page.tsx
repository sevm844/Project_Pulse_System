"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentShell from "./_components/StudentShell";
import DeadlineCalendar from "../_components/calendar/DeadlineCalendar";
import TimelineStrip from "../_components/health/TimelineStrip";
import Card from "./_components/Card";
import CardHeading from "../_components/CardHeading";
import { HeroCard, greetingFor, heroEyebrowClass } from "../_components/DashboardCard";
import { getStoredUserName } from "../_utils/authStorage";
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
    text: "Your adviser decides on each title you propose. Send up to 3 and she approves the ones you can defend.",
    action: "Submit Title Proposal",
    href: "/student/requirements",
  };

  if (group.proposal_passed && !(group.capstone_adviser && group.technical_adviser)) {
    nextStep = {
      heading: "Wait for your Capstone and Technical advisers",
      text: "You passed your Proposal Defense. Your AppDev adviser now assigns your Capstone adviser and your Technical adviser. You will be told as soon as they are named.",
      action: "View My Project",
      href: "/student/project",
    };
  } else if (stage === "Client Consultation") {
    nextStep = {
      heading: "Client consultation",
      text: "Your titles are approved. Meet your client, and the Dean for his signature, then your adviser confirms the one title you will defend.",
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
      <div>
        <div className="space-y-6">
          {/* Slim greeting bar: the deadline calendar below is the main thing on a student's dashboard (the user's decision, 2026-11-24). */}
          <HeroCard tone="green">
            <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 px-6 py-5 sm:px-7">
              <div className="min-w-0">
                <p className={heroEyebrowClass("green")}>
                  {greetingFor()}, {getStoredUserName() ?? "student"}
                </p>
                <h1 className={`mt-1 text-2xl font-semibold tracking-tight ${approvedTitle ? "text-white" : "text-white/60"}`}>{approvedTitle || NO_TITLE_YET}</h1>
                <p className="mt-1 text-xs font-semibold text-white/75">
                  {group.group_name} · {group.course} {group.section} · Adviser: {group.adviser?.name || "Not assigned"}
                </p>
              </div>

              <dl className="flex gap-8 text-white">
                <div>
                  <dt className="text-[11px] font-medium text-white/65">Current phase</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{progress?.current_phase ?? stage}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-white/65">Upcoming defense</dt>
                  <dd className="mt-0.5 text-sm font-semibold">
                    {scheduledDefense ? `${scheduledDefense.label} · ${scheduledDefense.detail.replace("Scheduled ", "")}` : "Not scheduled yet"}
                  </dd>
                </div>
              </dl>
            </div>
          </HeroCard>

          <TimelineStrip groupId={group.group_id} title="Your capstone timeline" moreHref="/student/project" />

          <DeadlineCalendar />



          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <Card className={emptyCardClass}>
              <CardHeading title="Next Step" tone="lime" />
              <p className="text-sm font-semibold text-[#203028]">
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
              <CardHeading title="Group Members" tone="aqua" />

              <div className="space-y-3">
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

          {progress && (
            <Card className={emptyCardClass}>
              <CardHeading title="Project Progress" tone="mint" />
              <div>
                <ProgressTracker progress={progress} />
              </div>
            </Card>
          )}
        </div>

      </div>
    </StudentShell>
  );
}
