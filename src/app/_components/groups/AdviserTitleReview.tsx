"use client";

import { useCallback, useEffect, useState } from "react";
import { GroupStatusNote, StageSteps, titleStatusClass } from "../ProposalStage";
import { apiFetch } from "../../_lib/api";
import {
  chooseGroupTitle,
  errorMessage,
  isGroupConfirmed,
  NO_TITLE_YET,
  sendGroupToDean,
  type ApiGroup,
  type ApiTitleSubmission,
} from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

type GroupTitles = { group: ApiGroup; titles: ApiTitleSubmission[] };
type Decision = "Approved" | "Needs Revision" | "Rejected";

const buttonClass = "rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]";

// The adviser side of the Title Proposal assignment: decide on each title, send to the Dean, choose the final title.
// `sections` limits the list to the groups the assignment is for (null = all of the adviser's groups).
export default function AdviserTitleReview({
  sections,
  onChanged,
}: {
  sections: string[] | null;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<GroupTitles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  // The title the adviser is writing remarks for, and whether it is a revision request or a rejection.
  const [deciding, setDeciding] = useState<{ id: number; status: Exclude<Decision, "Approved"> } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [chosen, setChosen] = useState<Record<number, number>>({});

  const sectionKey = sections ? sections.join("|") : "";

  const load = useCallback(async () => {
    try {
      const wanted = sectionKey ? sectionKey.split("|") : null;
      const groups = (await apiFetch<ApiGroup[]>("/groups")).filter(
        (group) =>
          group.group_status !== "Closed" &&
          (!wanted || wanted.includes(`${group.course} ${group.section}`)),
      );
      const loaded = await Promise.all(
        groups.map(async (group) => ({
          group,
          titles: group.project
            ? await apiFetch<ApiTitleSubmission[]>(`/projects/${group.project.project_id}/titles`)
            : [],
        })),
      );

      setItems(loaded);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load title proposals."));
    }

    setLoading(false);
  }, [sectionKey]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function refresh() {
    await load();
    onChanged();
  }

  async function review(submission: ApiTitleSubmission, status: Decision) {
    if (status !== "Approved" && !remarks.trim()) {
      setError("Write remarks so the students know what to change.");
      return;
    }

    setSavingId(submission.title_id);
    setError("");
    setNotice("");

    try {
      await apiFetch(`/title-submissions/${submission.title_id}`, {
        method: "PUT",
        body: JSON.stringify({ status, remarks: status === "Approved" ? null : remarks.trim() }),
      });

      setNotice(
        status === "Approved"
          ? `"${submission.proposed_title}" was approved. When you are ready, send the group to the Dean.`
          : `"${submission.proposed_title}" was sent back with your remarks.`,
      );
      setDeciding(null);
      setRemarks("");
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Unable to save your review."));
    }

    setSavingId(null);
  }

  // Runs a stage action for one group (send to the Dean / choose the title), then refreshes the list.
  async function stageAction(group: ApiGroup, action: () => Promise<ApiGroup>, message: string) {
    setSavingId(group.group_id);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(message);
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "That did not work. Please try again."));
    }

    setSavingId(null);
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <p className="text-xs leading-5 text-[#59645d]">
        You decide on every title: approve it, ask for changes, or reject it (remarks are required for the last two).
        Approving does not move the group. Once you have up to 3 approved titles, send the group to the Dean yourself.
      </p>

      {error && (
        <p role="alert" className="text-xs text-[#b42318]">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="text-xs text-[#2f6f3a]">
          {notice}
        </p>
      )}

      {loading && <p className="text-xs text-[#7b877f]">Loading groups...</p>}

      {!loading && items.length === 0 && !error && (
        <p className="text-xs text-[#9aa59e]">No groups for this assignment yet. Create a group in Assigned Groups.</p>
      )}

      {items.map(({ group, titles }) => {
        const stage = group.project?.proposal_stage;
        const open = stage === "Title Proposal" && group.group_status === "Active";
        const approved = titles.filter((item) => item.title_status === "Approved");
        const hasPending = titles.some((item) => item.title_status === "Pending");
        const confirmed = isGroupConfirmed(group);
        const busy = savingId === group.group_id;
        const endorsed = group.project?.endorsement?.titles ?? [];
        const pick = chosen[group.group_id];

        const blocker = !approved.length
          ? "Approve at least one title first."
          : hasPending
            ? "Decide on every pending title first."
            : !confirmed
              ? "Every member must accept the group invitation first."
              : "";

        return (
          <section key={group.group_id} className="rounded-xl border border-[#edf2ec] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#203028]">
                  {group.group_name}
                  <GroupStatusNote status={group.group_status} />
                </h3>
                <p className="mt-0.5 text-xs text-[#7b877f]">
                  {group.course} {group.section}
                </p>
              </div>

              <p className="text-xs font-semibold text-[#59645d]">
                Chosen title: {group.project?.project_title || NO_TITLE_YET}
              </p>
            </div>

            {stage && (
              <div className="mt-4">
                <StageSteps stage={stage} />
              </div>
            )}

            {open && (
              <div className="mt-4 rounded-lg bg-[#f8faf7] p-3">
                <p className="text-sm text-[#203028]">
                  <span className="font-semibold">{approved.length}</span> approved title
                  {approved.length === 1 ? "" : "s"} (up to 3 is ideal).
                </p>
                {blocker && <p className="mt-1 text-xs text-[#7b877f]">{blocker}</p>}
                <button
                  type="button"
                  disabled={busy || Boolean(blocker)}
                  onClick={() =>
                    void stageAction(group, () => sendGroupToDean(group.group_id), `${group.group_name} was sent to the Dean for endorsement.`)
                  }
                  className="mt-3 rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
                >
                  {busy ? "Sending..." : "Send to Dean for endorsement"}
                </button>
              </div>
            )}

            {stage === "Dean's Endorsement" && (
              <p className="mt-4 rounded-lg bg-[#f8faf7] p-3 text-sm text-[#59645d]">
                Waiting for the Dean to review the approved titles, talk with the group and sign off.
              </p>
            )}

            {stage === "Client Consultation" && group.group_status === "Active" && (
              <div className="mt-4 rounded-lg bg-[#f8faf7] p-3">
                <p className="text-sm font-semibold text-[#203028]">The Dean signed off. Pick the title to defend.</p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  After the client consultations, confirm with the group which single endorsed title they will defend.
                </p>
                {group.project?.endorsement?.notes && (
                  <p className="mt-2 rounded-lg bg-white p-3 text-xs text-[#59645d]">
                    Dean&apos;s notes: {group.project.endorsement.notes}
                  </p>
                )}

                <div className="mt-3 space-y-2">
                  {endorsed.map((item) => (
                    <label key={item.title_id} className="flex items-center gap-2 text-sm text-[#203028]">
                      <input
                        type="radio"
                        name={`chosen-${group.group_id}`}
                        checked={pick === item.title_id}
                        onChange={() => setChosen((current) => ({ ...current, [group.group_id]: item.title_id }))}
                      />
                      {item.proposed_title}
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={busy || !pick}
                  onClick={() =>
                    void stageAction(group, () => chooseGroupTitle(group.group_id, pick), `${group.group_name} is ready for the Proposal Defense.`)
                  }
                  className="mt-3 rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
                >
                  {busy ? "Saving..." : "Confirm title - ready for Proposal Defense"}
                </button>
              </div>
            )}

            {stage === "Ready for Proposal Defense" && (
              <p className="mt-4 rounded-lg bg-[#f2fbef] p-3 text-sm text-[#2f6b3c]">
                This group is ready. Schedule its Proposal Defense from the Defense page.
              </p>
            )}

            <ul className="mt-4 divide-y divide-[#edf2ec]">
              {titles.length === 0 && <li className="py-2 text-xs text-[#9aa59e]">No proposals submitted yet.</li>}

              {titles.map((item) => (
                <li key={item.title_id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">{item.proposed_title}</p>
                      <p className="mt-0.5 text-[11px] text-[#9aa59e]">
                        Submitted {formatDate(item.submitted_at)}
                        {item.technology_stack ? ` · ${item.technology_stack}` : ""}
                      </p>
                    </div>

                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${titleStatusClass[item.title_status]}`}>
                      {item.title_status}
                    </span>
                  </div>

                  {item.project_description && (
                    <p className="mt-2 text-xs leading-5 text-[#59645d]">{item.project_description}</p>
                  )}

                  {item.review_remarks && (
                    <p className="mt-2 text-xs leading-5 text-[#59645d]">
                      <span className="font-semibold text-[#203028]">Remarks:</span> {item.review_remarks}
                    </p>
                  )}

                  {open && item.title_status === "Pending" && (
                    <div className="mt-3">
                      {deciding?.id === item.title_id ? (
                        <div className="space-y-2">
                          <textarea
                            value={remarks}
                            onChange={(event) => setRemarks(event.target.value)}
                            placeholder={
                              deciding.status === "Rejected"
                                ? "Why is this title rejected? (required)"
                                : "What should the students change? (required)"
                            }
                            rows={3}
                            maxLength={2000}
                            className="w-full resize-none rounded-lg border border-[#dfe8df] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={savingId === item.title_id}
                              onClick={() => void review(item, deciding.status)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              {deciding.status === "Rejected" ? "Send rejection" : "Send revision request"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeciding(null);
                                setRemarks("");
                              }}
                              className={buttonClass}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={savingId === item.title_id}
                            onClick={() => void review(item, "Approved")}
                            className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
                          >
                            Approve
                          </button>
                          {(["Needs Revision", "Rejected"] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setDeciding({ id: item.title_id, status });
                                setRemarks("");
                                setError("");
                              }}
                              className={buttonClass}
                            >
                              {status === "Rejected" ? "Reject" : "Request revision"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
