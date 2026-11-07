"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import { apiFetch } from "../../../_lib/api";
import {
  errorMessage,
  NO_ADVISER_YET,
  NO_TITLE_YET,
  type ApiGroup,
  type ApiTitleSubmission,
} from "../../../_lib/groups";
import { formatDate } from "../../../_lib/requirements";

const statusClass: Record<ApiTitleSubmission["title_status"], string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
};

export default function DeanProjectProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [titles, setTitles] = useState<ApiTitleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const loaded = await apiFetch<ApiGroup>(`/groups/${id}`);
        if (cancelled) return;
        setGroup(loaded);

        if (loaded.project) {
          const submissions = await apiFetch<ApiTitleSubmission[]>(
            `/projects/${loaded.project.project_id}/titles`,
          );
          if (!cancelled) setTitles(submissions);
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Unable to load this project."));
      }

      if (!cancelled) setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!group) {
    return (
      <DeanShell title="Project Profile">
        <Card className="p-6">
          <p className="text-sm text-[#7b877f]">
            {loading ? "Loading project..." : error || "Project not found."}
          </p>
        </Card>
      </DeanShell>
    );
  }

  const title = group.project?.project_title || null;

  return (
    <DeanShell title="Project Profile">
      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                className={`text-3xl font-semibold tracking-tight ${
                  title ? "text-[#203028]" : "text-[#7b877f]"
                }`}
              >
                {title || NO_TITLE_YET}
              </h2>

              <p className="mt-3 text-sm text-[#59645d]">
                {group.course} {group.section} • {group.group_name} • Adviser:{" "}
                {group.adviser?.name || NO_ADVISER_YET}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dean/administration/groups"
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
              >
                Manage Group
              </Link>
              <Link
                href="/dean/messages"
                className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
              >
                Message Group
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Stage", group.project?.current_stage || "-"],
            ["Group Code", group.group_code],
            ["School Year", group.school_year || "-"],
            ["Semester", group.semester || "-"],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-lg font-semibold text-[#203028]">{value}</p>
            </Card>
          ))}
        </div>

        {group.project?.project_description && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Description</h3>
            <p className="mt-3 text-sm leading-7 text-[#59645d]">
              {group.project.project_description}
            </p>
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Title Proposals
            </h3>

            <div className="mt-4 space-y-3">
              {titles.length === 0 && (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  The group has not submitted a title proposal yet.
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
                        {item.reviewed_by ? ` • Reviewed by ${item.reviewed_by.name}` : ""}
                      </p>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[item.title_status]}`}>
                      {item.title_status}
                    </span>
                  </div>

                  {item.review_remarks && (
                    <p className="mt-3 text-xs leading-5 text-[#59645d]">
                      Remarks: {item.review_remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Members</h3>

            <div className="mt-4 space-y-3">
              {group.members.map((member) => (
                <div key={member.member_id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">{member.name}</p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {member.role_in_group} •{" "}
                    {member.accepted_at ? "Accepted" : "Invitation pending"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DeanShell>
  );
}
