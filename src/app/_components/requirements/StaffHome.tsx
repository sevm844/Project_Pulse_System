"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import type { ApiGroup } from "../../_lib/groups";
import { errorMessage } from "../../_lib/groups";
import DashboardCard, { DashboardHeader } from "../DashboardCard";
import RoleCalendar from "../RoleCalendar";
import RiskList from "../health/RiskList";
import { useRisks } from "../health/useRisks";
import { ProgressList } from "../progress/ProgressViews";
import { useProgress } from "../progress/useProgress";
import {
  attentionCount,
  attentionLabel,
  type ApiRequirement,
  type StaffRole,
} from "../../_lib/requirements";

type HomeRole = Exclude<StaffRole, "Dean">;

const copy: Record<HomeRole, { href: string; verb: string; idle: string; title: string; text: string }> = {
  Adviser: {
    href: "/adviser/requirements",
    verb: "to review",
    idle: "Nothing is waiting for your review.",
    title: "Your groups and reviews",
    text: "See what is waiting for your review and how each of your groups is doing.",
  },
  Coordinator: {
    href: "/coordinator/requirements",
    verb: "to receive",
    idle: "No approved final outputs are waiting to be received.",
    title: "Final outputs and records",
    text: "Receive the approved final outputs and keep every group's folder complete.",
  },
  Grammarian: {
    href: "/grammarian/review-queue",
    verb: "to check",
    idle: "No documents are waiting for a grammar check.",
    title: "Grammar checks",
    text: "Check the documents your advisers approved, and issue certificates for the manuscripts the Dean sends you.",
  },
};

// A landing page in cards, like the student's: what is waiting on you, and where to go.
export default function StaffHome({ role }: { role: HomeRole }) {
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [groups, setGroups] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Only advisers follow groups here; the other roles are not allowed to ask for these.
  const progress = useProgress(role === "Adviser").items;
  const risks = useRisks(role === "Adviser").items;

  useEffect(() => {
    async function load() {
      try {
        setRequirements(await apiFetch<ApiRequirement[]>("/requirements"));

        if (role === "Adviser") {
          setGroups((await apiFetch<ApiGroup[]>("/groups")).length);
        }
      } catch (err) {
        setError(errorMessage(err, "Unable to load your overview."));
      }

      setLoading(false);
    }

    void load();
  }, [role]);

  const waiting = requirements
    .map((requirement) => ({ requirement, count: attentionCount(role, requirement) }))
    .filter((item) => item.count > 0);
  const total = waiting.reduce((sum, item) => sum + item.count, 0);

  const stats = [
    { label: `Waiting ${copy[role].verb}`, value: loading ? "–" : total },
    { label: "Requirements", value: loading ? "–" : requirements.length },
    ...(role === "Adviser"
      ? [
          { label: "Groups", value: groups ?? "–" },
          { label: "Groups that need attention", value: risks.length },
        ]
      : []),
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-6">
        <DashboardHeader eyebrow={`${role} Dashboard`} title={copy[role].title} text={copy[role].text} stats={stats} />

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <DashboardCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">Needs your attention</h2>
            <Link
              href={copy[role].href}
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
            >
              Open requirements
            </Link>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-[#7b877f]">Loading...</p>
          ) : waiting.length === 0 ? (
            <p className="mt-4 rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">{copy[role].idle}</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec] bg-white">
              {waiting.map(({ requirement, count }) => (
                <li key={requirement.requirement_id}>
                  <Link
                    href={copy[role].href}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-[#fbfdfb]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#203028]">{requirement.title}</span>
                      <span className="mt-0.5 block text-xs text-[#7b877f]">{requirement.stage}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-[#59645d]">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      {attentionLabel(role, count)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        {role === "Adviser" && risks.length > 0 && (
          <DashboardCard className="p-5">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
              Groups that need attention <span className="text-sm font-normal text-[#9aa59e]">· {risks.length}</span>
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">Late, stuck or waiting too long. Most serious first.</p>
            <div className="mt-4">
              <RiskList items={risks} href={() => "/adviser/assigned-groups"} />
            </div>
          </DashboardCard>
        )}

        {role === "Adviser" && progress.length > 0 && (
          <DashboardCard className="p-5">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">Where your groups are</h2>
            <p className="mt-1 text-sm text-[#7b877f]">Each group&apos;s progress through the capstone.</p>
            <div className="mt-4">
              <ProgressList items={progress} href="/adviser/assigned-groups" />
            </div>
          </DashboardCard>
        )}
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <RoleCalendar role={role} />
      </div>
    </div>
  );
}
