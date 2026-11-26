"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import CloseGroupDialog from "../../../_components/groups/CloseGroupDialog";
import RemoveMemberDialog from "../../../_components/groups/RemoveMemberDialog";
import { GroupStatusNote, StageSteps } from "../../../_components/ProposalStage";
import GroupTimeline from "../../../_components/health/GroupTimeline";
import TimelineStrip from "../../../_components/health/TimelineStrip";
import CertificateList from "../../../_components/certificates/CertificateList";
import GroupAdvisers from "../../../_components/groups/GroupAdvisers";
import MonitoringForms from "../../../_components/groups/MonitoringForms";
import ManuscriptHistory from "../../../_components/manuscript/ManuscriptHistory";
import SimilarityReports from "../../../_components/manuscript/SimilarityReports";
import { ProgressTracker } from "../../../_components/progress/ProgressViews";
import { useProgress } from "../../../_components/progress/useProgress";
import { apiFetch } from "../../../_lib/api";
import {
  closeGroup,
  reopenGroup,
  errorMessage,
  NO_ADVISER_YET,
  NO_TITLE_YET,
  removeGroupMember,
  setGroupLeader,
  type ApiGroup,
  type ApiGroupMember,
  type ApiTitleSubmission,
  type CloseReason,
  type RemovalReason,
} from "../../../_lib/groups";
import { formatDateTime } from "../../../_lib/requirements";
import CollapsibleTitle from "../../../_components/groups/CollapsibleTitle";
import ProposalView from "../../../_components/groups/ProposalView";
import DescriptionText from "../../../_components/groups/DescriptionText";

export default function DeanProjectProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [titles, setTitles] = useState<ApiTitleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const overall = useProgress().items.find((item) => String(item.group_id) === id);
  // The manuscript is the Dean's subject from the Alpha stage: it opens once the group has passed its Proposal Defense.
  const manuscriptOpen = overall?.phases.find((phase) => phase.key === "proposal-defense")?.state === "done";
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<ApiGroupMember | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [reopening, setReopening] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

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

  // Runs one action and swaps the returned group in; shows its error if the server refuses.

  async function run(action: () => Promise<ApiGroup>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      setGroup(await action());
      setNotice(message);
    } catch (err) {
      setError(errorMessage(err, "That did not work. Please try again."));
    }

    setBusy(false);
  }

  async function removeMember(category: RemovalReason, details: string) {
    if (!group || !removing) return;

    setBusy(true);
    setRemoveError("");

    try {
      const exception = group.project?.proposal_stage !== "Title Proposal";
      setGroup(await removeGroupMember(group.group_id, removing.user_id, category, details, exception));
      setNotice(`${removing.name} was removed. The reason was saved to the audit log.`);
      setRemoving(null);
    } catch (err) {
      setRemoveError(errorMessage(err, "Unable to remove this member."));
    }

    setBusy(false);
  }

  async function closeWithReason(category: CloseReason, details: string) {
    if (!group) return;

    setBusy(true);
    setCloseError("");

    try {
      setGroup(await closeGroup(group.group_id, category, details));
      setNotice("The group was closed. Its history is kept and its students can join a new group.");
      setClosing(false);
    } catch (err) {
      setCloseError(errorMessage(err, "Unable to close this group."));
    }

    setBusy(false);
  }

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

  const project = group.project;
  const title = project?.project_title || null;
  const endorsed = project?.proposal_stage !== "Title Proposal";

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
                <GroupStatusNote status={group.group_status} />
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

          {project && (
            <div className="mt-5">
              <StageSteps stage={project.proposal_stage} />
            </div>
          )}
        </Card>

        <TimelineStrip groupId={group.group_id} title="Capstone timeline" />

        {overall && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Capstone Progress</h3>
            <div className="mt-4">
              <ProgressTracker progress={overall} />
            </div>
          </Card>
        )}

        {group.proposal_passed && group.project && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Advisers and Capstone Monitoring Form</h3>
            <GroupAdvisers group={group} canAssign={group.group_status !== "Closed"} onChanged={() => window.location.reload()} />
            <div className="mt-5">
              <MonitoringForms projectId={group.project.project_id} />
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-[#203028]">Timeline</h3>
          <p className="mt-1 text-sm text-[#7b877f]">Every deadline, defense and milestone of this group, in order.</p>
          <div className="mt-5">
            <GroupTimeline groupId={group.group_id} />
          </div>
        </Card>

        {group.project && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Manuscript</h3>
            {manuscriptOpen ? (
              <>
                <p className="mt-1 text-sm text-[#7b877f]">Each version the group submitted, with who saved it and when. Drafts stay private until submitted.</p>
                <div className="mt-4 space-y-4">
                  <SimilarityReports projectId={group.project.project_id} canUpload />
                  <ManuscriptHistory projectId={group.project.project_id} canReview showActivity plainDownload group={group} />
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm leading-6 text-[#7b877f]">
                The manuscript is your subject from the Alpha stage. You will see it here, with the similarity report, once the group passes its Proposal Defense. Until then the progress above shows where the group stands.
              </p>
            )}
          </Card>
        )}

        {group.project && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Certificate of editing/originality</h3>
            <p className="mt-1 text-sm text-[#7b877f]">Received from the Grammarian when this group passes the grammar check.</p>
            <div className="mt-4">
              <CertificateList projectId={group.project.project_id} />
            </div>
          </Card>
        )}

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

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Group Code", group.group_code],
            ["Academic Year", group.school_year || "-"],
            ["Semester", group.semester || "-"],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-lg font-semibold text-[#203028]">{value}</p>
            </Card>
          ))}
        </div>

        {project?.project_description && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Description</h3>
            <DescriptionText text={project.project_description} className="mt-3 text-sm leading-7 text-[#59645d]" />
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Title Proposals
            </h3>
            <p className="mt-1 text-xs text-[#7b877f]">The adviser decides on titles. The Dean signs on paper when the group meets him.</p>

            <div className="mt-4 space-y-3">
              {titles.length === 0 && (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  The group has not submitted a title proposal yet.
                </p>
              )}

              {titles.map((item) => (
                <div key={item.title_id} className="rounded-xl bg-[#f8faf7] p-4">
                  <CollapsibleTitle
                    title={item.proposed_title}
                    meta={`${item.submitted_by ? `Submitted by ${item.submitted_by.name} · ` : "Submitted "}${formatDateTime(item.submitted_at)}${item.reviewed_by ? ` · Reviewed by ${item.reviewed_by.name}` : ""}`}
                    status={item.title_status}
                  >
                    <ProposalView item={item} />

                    {item.review_remarks && (
                      <p className="mt-3 text-xs leading-5 text-[#59645d]">
                        Remarks: {item.review_remarks}
                      </p>
                    )}
                  </CollapsibleTitle>
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

                  <div className="mt-2 flex flex-wrap gap-2">
                    {member.role_in_group !== "Leader" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => setGroupLeader(group.group_id, member.user_id),
                            `${member.name} is now the leader.`,
                          )
                        }
                        className="rounded-full border border-[#dfe8df] px-3 py-1 text-[11px] font-semibold hover:bg-[#edf9e9] disabled:opacity-60"
                      >
                        Make leader
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setRemoveError("");
                        setRemoving(member);
                      }}
                      className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {endorsed ? "Exception removal" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}

              {group.members.length === 0 && (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">This group has no members left.</p>
              )}

              {endorsed && (
                <p className="text-[11px] leading-4 text-[#7b877f]">
                  Membership is locked once the titles are settled. Removal is only available as a recorded exception.
                </p>
              )}

              {group.group_status === "Pending Closure" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(() => closeGroup(group.group_id), "The group was closed. Its history is kept.")
                  }
                  className="w-full rounded-full bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
                >
                  Confirm closure
                </button>
              )}

              {group.group_status === "Active" && (
                <div className="border-t border-[#edf2ec] pt-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setCloseError("");
                      setClosing(true);
                    }}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Close group
                  </button>
                  <p className="mt-2 text-[11px] leading-4 text-[#7b877f]">
                    For a group that failed and will retake, stopped, or was disbanded. Its history is kept.
                  </p>
                </div>
              )}

              {group.group_status === "Closed" && group.closed_reason && (
                <p className="text-[11px] leading-4 text-[#7b877f]">Closed: {group.closed_reason}</p>
              )}

              {group.group_status === "Closed" && group.members.length > 0 && (
                <div className="border-t border-[#edf2ec] pt-3">
                  {reopening ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#203028]">
                        Why is it being reopened?
                        <textarea
                          value={reopenReason}
                          onChange={(event) => setReopenReason(event.target.value)}
                          rows={2}
                          maxLength={300}
                          className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy || reopenReason.trim().length < 5}
                          onClick={() =>
                            void run(
                              () => reopenGroup(group.group_id, reopenReason.trim()),
                              "The group was reopened. Defenses cancelled when it closed have to be scheduled again.",
                            ).then(() => setReopening(false))
                          }
                          className="rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
                        >
                          Reopen group
                        </button>
                        <button
                          type="button"
                          onClick={() => setReopening(false)}
                          className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setReopenReason("");
                          setReopening(true);
                        }}
                        className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-60"
                      >
                        Reopen group
                      </button>
                      <p className="mt-2 text-[11px] leading-4 text-[#7b877f]">
                        For a group closed by mistake or allowed to continue. It is refused if a member has joined another open group.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {closing && (
        <CloseGroupDialog
          groupName={group.group_name}
          busy={busy}
          error={closeError}
          onCancel={() => setClosing(false)}
          onSubmit={(category, details) => void closeWithReason(category, details)}
        />
      )}

      {removing && (
        <RemoveMemberDialog
          memberName={removing.name}
          groupName={group.group_name}
          exception={endorsed}
          busy={busy}
          error={removeError}
          onCancel={() => setRemoving(null)}
          onSubmit={(category, details) => void removeMember(category, details)}
        />
      )}
    </DeanShell>
  );
}
