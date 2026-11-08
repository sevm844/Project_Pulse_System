"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import RemoveMemberDialog from "../../../_components/groups/RemoveMemberDialog";
import { GroupStatusNote, StageSteps, titleStatusClass } from "../../../_components/ProposalStage";
import { ProgressTracker } from "../../../_components/progress/ProgressViews";
import { useProgress } from "../../../_components/progress/useProgress";
import { apiFetch } from "../../../_lib/api";
import {
  closeGroup,
  endorseGroup,
  errorMessage,
  NO_ADVISER_YET,
  NO_TITLE_YET,
  removeGroupMember,
  setGroupLeader,
  type ApiGroup,
  type ApiGroupMember,
  type ApiTitleSubmission,
  type RemovalReason,
} from "../../../_lib/groups";
import { formatDate } from "../../../_lib/requirements";

export default function DeanProjectProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [titles, setTitles] = useState<ApiTitleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const overall = useProgress().items.find((item) => String(item.group_id) === id);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<ApiGroupMember | null>(null);
  const [removeError, setRemoveError] = useState("");

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
      const exception = Boolean(group.project?.endorsement);
      setGroup(await removeGroupMember(group.group_id, removing.user_id, category, details, exception));
      setNotice(`${removing.name} was removed. The reason was saved to the audit log.`);
      setRemoving(null);
    } catch (err) {
      setRemoveError(errorMessage(err, "Unable to remove this member."));
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
  const endorsed = Boolean(project?.endorsement);
  const approved = titles.filter((item) => item.title_status === "Approved");
  const awaitingEndorsement =
    project?.proposal_stage === "Dean's Endorsement" && group.group_status === "Active";

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

        {overall && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Capstone Progress</h3>
            <div className="mt-4">
              <ProgressTracker progress={overall} />
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

        {awaitingEndorsement && (
          <Card className="border-[#123f2b] p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Endorse this group&apos;s titles</h3>
            <p className="mt-2 text-sm text-[#59645d]">
              The adviser approved the titles below and sent the group to you. Review them, discuss them with the
              group, then sign off. Signing off moves the group to Client Consultation. The group picks its single
              title later, after the client consultation.
            </p>

            <ul className="mt-4 space-y-2">
              {approved.map((item) => (
                <li key={item.title_id} className="rounded-lg bg-[#f8faf7] px-4 py-3 text-sm font-semibold text-[#203028]">
                  {item.proposed_title}
                  {item.project_description && (
                    <span className="mt-1 block text-xs font-normal text-[#59645d]">{item.project_description}</span>
                  )}
                </li>
              ))}
            </ul>

            <label className="mt-4 block text-xs font-semibold text-[#203028]">
              Notes from your discussion with the group (optional)
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                maxLength={2000}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] px-3 py-2.5 text-sm outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => endorseGroup(group.group_id, notes.trim()),
                  "Signed off. The group is now at Client Consultation.",
                )
              }
              className="mt-4 rounded-full bg-[#123f2b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
            >
              {busy ? "Signing off..." : "Sign off and endorse"}
            </button>
          </Card>
        )}

        {project?.endorsement && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Dean&apos;s endorsement</h3>
            <p className="mt-2 text-xs text-[#7b877f]">
              Signed by {project.endorsement.signed_by || "the Dean"} on {formatDate(project.endorsement.signed_at)}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-[#203028]">
              {project.endorsement.titles.map((item) => (
                <li key={item.title_id}>
                  • {item.proposed_title}
                  {project.chosen_title_id === item.title_id && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Chosen
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {project.endorsement.notes && (
              <p className="mt-3 rounded-lg bg-[#f8faf7] p-3 text-xs leading-5 text-[#59645d]">
                Notes: {project.endorsement.notes}
              </p>
            )}
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {[
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

        {project?.project_description && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Description</h3>
            <p className="mt-3 text-sm leading-7 text-[#59645d]">
              {project.project_description}
            </p>
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Title Proposals
            </h3>
            <p className="mt-1 text-xs text-[#7b877f]">The adviser decides on titles. You endorse the approved ones.</p>

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

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${titleStatusClass[item.title_status]}`}>
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
                  Membership is locked after your endorsement. Removal is only available as a recorded exception.
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
            </div>
          </Card>
        </div>
      </div>

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
