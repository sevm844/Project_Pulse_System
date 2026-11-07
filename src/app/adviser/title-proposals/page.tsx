"use client";

import { useCallback, useEffect, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import { apiFetch } from "../../_lib/api";
import {
  errorMessage,
  NO_TITLE_YET,
  type ApiGroup,
  type ApiTitleSubmission,
} from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

type GroupTitles = { group: ApiGroup; titles: ApiTitleSubmission[] };

const statusClass: Record<ApiTitleSubmission["title_status"], string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
};

export default function AdviserTitleProposalsPage() {
  const [items, setItems] = useState<GroupTitles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");

  const load = useCallback(async () => {
    try {
      const groups = await apiFetch<ApiGroup[]>("/groups");
      const loaded = await Promise.all(
        groups.map(async (group) => ({
          group,
          titles: group.project
            ? await apiFetch<ApiTitleSubmission[]>(
                `/projects/${group.project.project_id}/titles`,
              )
            : [],
        })),
      );

      setItems(loaded);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load title proposals."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function review(
    submission: ApiTitleSubmission,
    status: "Approved" | "Rejected",
  ) {
    if (status === "Rejected" && !remarks.trim()) {
      setError("Write remarks before rejecting a title.");
      return;
    }

    setSavingId(submission.title_id);
    setError("");
    setNotice("");

    try {
      await apiFetch(`/title-submissions/${submission.title_id}`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          remarks: status === "Rejected" ? remarks.trim() : null,
        }),
      });

      setNotice(
        status === "Approved"
          ? `"${submission.proposed_title}" is now the project title.`
          : `"${submission.proposed_title}" was sent back with your remarks.`,
      );
      setRejectingId(null);
      setRemarks("");
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to save your review."));
    }

    setSavingId(null);
  }

  const pendingCount = items.reduce(
    (sum, item) =>
      sum + item.titles.filter((title) => title.title_status === "Pending").length,
    0,
  );

  return (
    <AdviserShell title="Title Proposals">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Review Title Proposals
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Approving a title makes it the group&apos;s official project title.
            Rejecting one requires remarks so the students can revise.
          </p>
          <p className="mt-3 text-xs font-semibold text-[#4f8f58]">
            {pendingCount} proposal{pendingCount === 1 ? "" : "s"} waiting for review
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {notice}
            </p>
          )}
        </Card>

        {loading && <p className="text-sm text-[#7b877f]">Loading groups...</p>}

        {!loading && items.length === 0 && !error && (
          <Card className="p-5">
            <p className="text-sm text-[#7b877f]">
              You have no groups yet. Create a group in Assigned Groups first.
            </p>
          </Card>
        )}

        {items.map(({ group, titles }) => (
          <Card key={group.group_id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#203028]">{group.group_name}</h3>
                <p className="mt-1 text-xs text-[#7b877f]">
                  {group.course} {group.section}
                </p>
              </div>

              <p className="text-xs font-semibold text-[#59645d]">
                Official title: {group.project?.project_title || NO_TITLE_YET}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {titles.length === 0 && (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  No proposals submitted yet.
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

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[item.title_status]}`}>
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
                      <span className="font-semibold text-[#203028]">Remarks:</span>{" "}
                      {item.review_remarks}
                    </p>
                  )}

                  {item.title_status === "Pending" && (
                    <div className="mt-4">
                      {rejectingId === item.title_id ? (
                        <div className="space-y-2">
                          <textarea
                            value={remarks}
                            onChange={(event) => setRemarks(event.target.value)}
                            placeholder="Remarks for the students (required)"
                            rows={3}
                            maxLength={2000}
                            className="w-full resize-none rounded-xl border border-[#dfe8df] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={savingId === item.title_id}
                              onClick={() => review(item, "Rejected")}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              Send Rejection
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(null);
                                setRemarks("");
                              }}
                              className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={savingId === item.title_id}
                            onClick={() => review(item, "Approved")}
                            className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(item.title_id);
                              setRemarks("");
                              setError("");
                            }}
                            className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AdviserShell>
  );
}
