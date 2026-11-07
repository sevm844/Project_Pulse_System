"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import { apiFetch } from "../../_lib/api";
import {
  errorMessage,
  fetchMyGroup,
  NO_TITLE_YET,
  type ApiGroup,
  type ApiTitleSubmission,
} from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

type ProjectTab = "overview" | "titles" | "team";

const tabs: Array<[ProjectTab, string]> = [
  ["overview", "Overview"],
  ["titles", "Title Proposals"],
  ["team", "Team"],
];

const emptyForm = {
  proposed_title: "",
  project_description: "",
  technology_stack: "",
};

const inputClass =
  "w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

const statusClass: Record<ApiTitleSubmission["title_status"], string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
};

export default function ProjectPage() {
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [titles, setTitles] = useState<ApiTitleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const myGroup = await fetchMyGroup();
        if (cancelled) return;

        setGroup(myGroup);

        if (myGroup?.project) {
          const submissions = await apiFetch<ApiTitleSubmission[]>(
            `/projects/${myGroup.project.project_id}/titles`,
          );
          if (!cancelled) setTitles(submissions);
        }
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

  async function submitTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group?.project) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const created = await apiFetch<ApiTitleSubmission>(
        `/projects/${group.project.project_id}/titles`,
        {
          method: "POST",
          body: JSON.stringify({
            proposed_title: form.proposed_title.trim(),
            project_description: form.project_description.trim() || null,
            technology_stack: form.technology_stack.trim() || null,
          }),
        },
      );

      setTitles((current) => [created, ...current]);
      setForm(emptyForm);
      setNotice("Title proposal sent to your adviser for review.");
    } catch (err) {
      setError(errorMessage(err, "Unable to submit the title proposal."));
    }

    setSaving(false);
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
  const stage = group.project?.current_stage || "Proposal Defense";

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

            <p className="mt-4 text-sm leading-7 text-[#59645d]">
              {group.project?.project_description ||
                (approvedTitle
                  ? "No description was added to the approved title."
                  : "Your project description will appear here once your adviser approves a title.")}
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

        {tab === "titles" && (
          <div className="space-y-5">
            {!approvedTitle && (
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-[#203028]">
                  Submit a Title Proposal
                </h3>
                <p className="mt-1 text-sm text-[#7b877f]">
                  Your adviser reviews each proposal. When one is approved, it
                  becomes your official project title.
                </p>

                <form onSubmit={submitTitle} className="mt-5 space-y-4">
                  <label className="block space-y-1.5 text-sm font-medium text-[#203028]">
                    <span>Proposed Title</span>
                    <input
                      required
                      maxLength={255}
                      value={form.proposed_title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          proposed_title: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="block space-y-1.5 text-sm font-medium text-[#203028]">
                    <span>Description (optional)</span>
                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={form.project_description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          project_description: event.target.value,
                        }))
                      }
                      className={`${inputClass} resize-none leading-6`}
                    />
                  </label>

                  <label className="block space-y-1.5 text-sm font-medium text-[#203028]">
                    <span>Technology Stack (optional)</span>
                    <input
                      maxLength={255}
                      value={form.technology_stack}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          technology_stack: event.target.value,
                        }))
                      }
                      placeholder="e.g., Next.js, Laravel, PostgreSQL"
                      className={inputClass}
                    />
                  </label>

                  {error && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  {notice && (
                    <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {notice}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={saving || !form.proposed_title.trim()}
                    className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
                  >
                    {saving ? "Sending..." : "Send to Adviser"}
                  </button>
                </form>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[#203028]">
                Your Proposals
              </h3>

              <div className="mt-4 space-y-3">
                {titles.length === 0 && (
                  <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                    You have not submitted any title proposals yet.
                  </p>
                )}

                {titles.map((item) => (
                  <div key={item.title_id} className="rounded-xl bg-[#f8faf7] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#203028]">
                          {item.proposed_title}
                        </p>
                        <p className="mt-1 text-xs text-[#7b877f]">
                          Submitted {formatDate(item.submitted_at)}
                          {item.technology_stack ? ` • ${item.technology_stack}` : ""}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[item.title_status]}`}
                      >
                        {item.title_status}
                      </span>
                    </div>

                    {item.project_description && (
                      <p className="mt-3 text-sm leading-6 text-[#59645d]">
                        {item.project_description}
                      </p>
                    )}

                    {item.review_remarks && (
                      <p className="mt-3 rounded-lg bg-white p-3 text-xs leading-5 text-[#59645d]">
                        <span className="font-semibold text-[#203028]">
                          Adviser remarks:
                        </span>{" "}
                        {item.review_remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
          </Card>
        )}
      </div>
    </StudentShell>
  );
}
