"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import type { ApiGroup } from "../../_lib/groups";
import { errorMessage } from "../../_lib/groups";
import {
  attentionCount,
  attentionLabel,
  type ApiRequirement,
  type StaffRole,
} from "../../_lib/requirements";

type HomeRole = Exclude<StaffRole, "Dean">;

const copy: Record<HomeRole, { href: string; verb: string; idle: string }> = {
  Adviser: {
    href: "/adviser/requirements",
    verb: "to review",
    idle: "Nothing is waiting for your review.",
  },
  Coordinator: {
    href: "/coordinator/requirements",
    verb: "to receive",
    idle: "No approved final outputs are waiting to be received.",
  },
  Grammarian: {
    href: "/grammarian/review-queue",
    verb: "to check",
    idle: "No documents are waiting for a grammar check.",
  },
};

// A quiet landing page: what is waiting on you, and where to go.
export default function StaffHome({ role }: { role: HomeRole }) {
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [groups, setGroups] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="mx-auto max-w-3xl">
      {error && (
        <p role="alert" className="mb-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <p className="text-3xl font-semibold text-[#203028]">{loading ? "–" : total}</p>
          <p className="mt-1 text-xs text-[#7b877f]">{copy[role].verb}</p>
        </div>

        <div>
          <p className="text-3xl font-semibold text-[#203028]">{loading ? "–" : requirements.length}</p>
          <p className="mt-1 text-xs text-[#7b877f]">requirements</p>
        </div>

        {role === "Adviser" && (
          <div>
            <p className="text-3xl font-semibold text-[#203028]">{groups ?? "–"}</p>
            <p className="mt-1 text-xs text-[#7b877f]">groups</p>
          </div>
        )}
      </div>

      <h2 className="mt-10 text-sm font-semibold text-[#203028]">Needs your attention</h2>

      {loading ? (
        <p className="mt-3 text-sm text-[#7b877f]">Loading...</p>
      ) : waiting.length === 0 ? (
        <p className="mt-3 text-sm text-[#7b877f]">{copy[role].idle}</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec] bg-white">
          {waiting.map(({ requirement, count }) => (
            <li key={requirement.requirement_id}>
              <Link
                href={copy[role].href}
                className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-[#fbfdfb]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#203028]">
                    {requirement.title}
                  </span>
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

      <Link
        href={copy[role].href}
        className="mt-6 inline-block text-xs font-semibold text-[#4f8f58] hover:underline"
      >
        Open requirements
      </Link>
    </div>
  );
}
