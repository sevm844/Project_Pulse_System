"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import { StageSteps } from "../../_components/ProposalStage";
import {
  errorMessage,
  fetchMyGroup,
  leaveGroup,
  NO_TITLE_YET,
  type ApiGroup,
} from "../../_lib/groups";

type ProjectTab = "overview" | "team";

const tabs: Array<[ProjectTab, string]> = [
  ["overview", "Overview"],
  ["team", "Team"],
];

const inputClass =
  "w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

export default function ProjectPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const myGroup = await fetchMyGroup();
        if (cancelled) return;

        setGroup(myGroup);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Unable to load your project."));
      }

      if (!cancelled) setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function leave() {
    if (!group) return;

    setSaving(true);
    setError("");

    try {
      await leaveGroup(group.group_id, leaveReason.trim());
      router.replace("/student");
    } catch (err) {
      setError(errorMessage(err, "Unable to leave the group."));
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <StudentShell title="My Project">
        <p className="text-sm text-[#7b877f]">Loading your project...</p>
      </StudentShell>
    );
  }

  if (!group) {
    return (
      <StudentShell title="My Project">
        <Card className="p-6">
          <p className="text-sm text-[#59645d]">
            {error || "You have not been added to a capstone group yet."}
          </p>
          <Link
            href="/student/setup"
            className="mt-4 inline-block text-xs font-semibold text-[#4f8f58] hover:underline"
          >
            Go to group setup
          </Link>
        </Card>
      </StudentShell>
    );
  }

  const approvedTitle = group.project?.project_title || null;
  const stage = group.project?.proposal_stage ?? "Title Proposal";
  const endorsed = Boolean(group.project?.endorsement);

  return (
    <StudentShell title="My Project">
      <div className="space-y-5">
        <Card className="p-5">
          <h2
            className={`text-xl font-semibold ${
              approvedTitle ? "text-[#203028]" : "text-[#7b877f]"
            }`}
          >
            {approvedTitle || NO_TITLE_YET}
          </h2>

          <p className="mt-1 text-sm text-[#7b877f]">
            {group.group_name} • {group.course} {group.section}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  tab === id
                    ? "bg-[#123f2b] text-white"
                    : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        {tab === "overview" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Overview</h3>

            <div className="mt-4">
              <StageSteps stage={stage} />
            </div>

            <p className="mt-4 text-sm leading-7 text-[#59645d]">
              {group.project?.project_description ||
                (approvedTitle
                  ? "No description was added to the chosen title."
                  : "Your project description will appear here once you choose the title you will defend.")}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Group Name", group.group_name],
                ["Group Code", group.group_code],
                ["Adviser", group.adviser?.name || "Not assigned"],
                ["Stage", stage],
                [
                  "School Year / Semester",
                  [group.school_year, group.semester].filter(Boolean).join(" / ") || "-",
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-xs text-[#7b877f]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#203028]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "team" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Team</h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {group.members.map((member) => (
                <div key={member.member_id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {member.name}
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#4f8f58]">
                    {member.role_in_group}
                  </p>

                  <p className="mt-1 text-xs text-[#7b877f]">
                    {member.accepted_at ? "Accepted" : "Invitation pending"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[#edf2ec] pt-5">
              <h4 className="text-sm font-semibold text-[#203028]">Leave this group</h4>

              {endorsed ? (
                <p className="mt-2 text-xs leading-5 text-[#7b877f]">
                  The Dean already endorsed your group&apos;s titles, so membership is locked. If you have a genuine
                  emergency, ask the Dean&apos;s office.
                </p>
              ) : leaving ? (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-[#59645d]">
                    You will be removed from {group.group_name}. If you were the leader, the next member becomes leader.
                  </p>
                  <input
                    value={leaveReason}
                    onChange={(event) => setLeaveReason(event.target.value)}
                    maxLength={300}
                    placeholder="Reason (optional)"
                    className={inputClass}
                  />
                  {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void leave()}
                      className="rounded-lg bg-[#b3261e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8f1e18] disabled:opacity-50"
                    >
                      {saving ? "Leaving..." : "Yes, leave the group"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaving(false)}
                      className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setLeaving(true)}
                  className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Leave group
                </button>
              )}
            </div>
          </Card>
        )}
      </div>
    </StudentShell>
  );
}
