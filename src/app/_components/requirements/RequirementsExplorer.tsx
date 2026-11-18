"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiFetch, downloadRequirementAttachment } from "../../_lib/api";
import { COURSE_NAMES, COURSE_OPTIONS, errorMessage, type ApiGroup } from "../../_lib/groups";
import {
  describeFileRules,
  formatDate,
  type ApiRequirement,
  type ApiSubmissionRow,
} from "../../_lib/requirements";
import AdviserTitleReview from "../groups/AdviserTitleReview";
import GroupFilterBar, { NO_GROUP_FILTER, type GroupFilter } from "./GroupFilterBar";
import RequirementDialog from "./RequirementDialog";
import SubmissionRow, { filterRows, rowFacts } from "./SubmissionRow";

// Adviser and Dean browse the same way, one clean screen at a time:
// Courses > Sections of a course > Assignments of a section > Groups of an assignment (each opens on its own).
type Nav = { course?: string; section?: string; requirementId?: number };

const blurb = {
  Adviser: "Ask your groups for chapters, forms or links, then review what they send.",
  Dean: "Set requirements for every group or one course, and watch progress across the program.",
};

const sectionLabel = (course: string, section: string) => `${course} ${section}`;

// One card of a grid: a big name, a quiet line under it, and the numbers along the bottom.
// A card that cannot be opened (no groups yet) is drawn dashed and faded.
function Tile({
  title,
  note,
  children,
  review,
  showReview = true,
  onOpen,
}: {
  title: string;
  note?: ReactNode;
  children?: ReactNode;
  review?: ReactNode;
  // False when the count is not known for this card (so it never says "Nothing to review" by mistake).
  showReview?: boolean;
  onOpen?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold tracking-tight text-[#203028]">{title}</p>
        {onOpen && <span aria-hidden="true" className="text-lg leading-none text-[#9aa59e] transition group-hover:translate-x-0.5 group-hover:text-[#4f8f58]">›</span>}
      </div>
      {note && <p className="mt-1 text-xs leading-5 text-[#7b877f]">{note}</p>}
      <div className="mt-auto pt-4">
        {children}
        {showReview && (
          <p className="mt-2 text-xs text-[#59645d]">{review ?? <span className="text-[#9aa59e]">Nothing to review</span>}</p>
        )}
      </div>
    </>
  );

  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[150px] flex-col rounded-2xl border border-[#dfe8df] bg-white p-5 text-left shadow-[0_8px_24px_rgba(32,48,40,0.05)] transition hover:-translate-y-0.5 hover:border-[#4f8f58] hover:shadow-[0_14px_32px_rgba(32,48,40,0.1)]"
    >
      {body}
    </button>
  ) : (
    <div className="flex min-h-[150px] flex-col rounded-2xl border border-dashed border-[#dfe8df] bg-[#fbfdfb] p-5 opacity-70">{body}</div>
  );
}

// A thin progress line for "x of y submitted".
function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div>
      <div className="h-1.5 rounded-full bg-[#edf2ec]">
        <div className="h-1.5 rounded-full bg-[#4f8f58]" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-[#7b877f]">{done} of {total} submitted</p>
    </div>
  );
}

const reviewNote = (count: number) =>
  count > 0 ? <span className="font-semibold text-amber-700">{count} to review</span> : null;

export default function RequirementsExplorer({ role }: { role: "Adviser" | "Dean" }) {
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [rowsById, setRowsById] = useState<Record<number, ApiSubmissionRow[]>>({});
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [nav, setNav] = useState<Nav>({});
  const [filter, setFilter] = useState<GroupFilter>(NO_GROUP_FILTER);
  const [dialog, setDialog] = useState<{ requirement?: ApiRequirement } | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, allGroups] = await Promise.all([
        apiFetch<ApiRequirement[]>("/requirements"),
        apiFetch<ApiGroup[]>("/groups"),
      ]);
      const entries = await Promise.all(
        list
          .filter((item) => item.kind !== "Title Proposal")
          .map(async (item) => [item.requirement_id, await apiFetch<ApiSubmissionRow[]>(`/requirements/${item.requirement_id}/submissions`)] as const),
      );

      setRequirements(list);
      setRowsById(Object.fromEntries(entries));
      setGroups(allGroups.filter((group) => group.group_status !== "Closed"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the requirements."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  function go(next: Nav) {
    setNav(next);
    setFilter(NO_GROUP_FILTER);
    setNotice("");
  }

  async function refresh(message?: string) {
    if (message) setNotice(message);
    await load();
  }

  async function remove(requirement: ApiRequirement) {
    if (!window.confirm(`Delete "${requirement.title}"?`)) return;

    try {
      await apiFetch(`/requirements/${requirement.requirement_id}`, { method: "DELETE" });
      go({ course: nav.course, section: nav.section });
      await refresh("Requirement deleted.");
    } catch (err) {
      setError(errorMessage(err, "Unable to delete the requirement."));
    }
  }

  const label = nav.course && nav.section ? sectionLabel(nav.course, nav.section) : "";
  const groupsOf = (course: string, section?: string) =>
    groups.filter((group) => group.course === course && (!section || group.section === section));

  // The submissions of every assignment that belong to one course (and section).
  const rowsIn = (course: string, section?: string) =>
    requirements.flatMap((item) =>
      (rowsById[item.requirement_id] ?? []).filter((row) => row.course === course && (!section || row.section === section)),
    );
  const toReview = (rows: ApiSubmissionRow[]) => rows.filter((row) => row.submission?.status === "Submitted").length;

  // Assignments that apply to one section. Title Proposal (adviser only) is listed when the adviser has groups there.
  function assignmentsOf(course: string, section: string) {
    const name = sectionLabel(course, section);
    const hasGroups = groupsOf(course, section).length > 0;

    return requirements.filter((item) =>
      item.kind === "Title Proposal"
        ? role === "Adviser" && hasGroups && (!item.sections || item.sections.length === 0 || item.sections.includes(name))
        : (rowsById[item.requirement_id] ?? []).some((row) => row.course === course && row.section === section),
    );
  }

  const requirement = requirements.find((item) => item.requirement_id === nav.requirementId);
  const canEdit = (item: ApiRequirement) => role === "Dean" || (role === "Adviser" && item.scope === "Adviser");

  // The path across the top: Courses > BSIT > 4A > Chapter 1.
  const crumbs: { text: string; to: Nav }[] = [{ text: "Courses", to: {} }];
  if (nav.course) crumbs.push({ text: nav.course, to: { course: nav.course } });
  if (nav.course && nav.section) crumbs.push({ text: nav.section, to: { course: nav.course, section: nav.section } });
  if (requirement) crumbs.push({ text: requirement.title, to: nav });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-sm leading-6 text-[#7b877f]">{blurb[role]}</p>
        <button
          type="button"
          onClick={() => setDialog({})}
          className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
        >
          New requirement
        </button>
      </div>

      <nav aria-label="Where you are" className="mt-6 flex flex-wrap items-center gap-2 border-b border-[#edf2ec] pb-3 text-xs">
        {crumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-[#c5cdc7]">›</span>}
            {index === crumbs.length - 1 ? (
              <span className="font-semibold text-[#203028]">{crumb.text}</span>
            ) : (
              <button type="button" onClick={() => go(crumb.to)} className="font-semibold text-[#4f8f58] hover:underline">
                {crumb.text}
              </button>
            )}
          </span>
        ))}
      </nav>

      {error && <p role="alert" className="mt-4 text-sm text-[#b42318]">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-[#2f6f3a]">{notice}</p>}
      {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

      {/* 1. Courses */}
      {!loading && !nav.course && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSE_OPTIONS.map((course) => {
            const inCourse = groupsOf(course);
            const sectionCount = new Set(inCourse.map((group) => group.section)).size;

            return (
              <Tile
                key={course}
                title={course}
                note={COURSE_NAMES[course]}
                review={reviewNote(toReview(rowsIn(course)))}
                onOpen={inCourse.length > 0 ? () => go({ course }) : undefined}
              >
                <p className="border-t border-[#edf2ec] pt-3 text-xs font-semibold text-[#203028]">
                  {inCourse.length > 0
                    ? `${sectionCount} section${sectionCount === 1 ? "" : "s"} · ${inCourse.length} group${inCourse.length === 1 ? "" : "s"}`
                    : "No groups yet"}
                </p>
              </Tile>
            );
          })}
        </div>
      )}

      {/* 2. Sections of the course */}
      {!loading && nav.course && !nav.section && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...new Set(groupsOf(nav.course).map((group) => group.section))].sort().map((section) => {
            const count = groupsOf(nav.course!, section).length;
            const assignments = assignmentsOf(nav.course!, section).length;

            return (
              <Tile
                key={section}
                title={`Section ${section}`}
                note={COURSE_NAMES[nav.course!]}
                review={reviewNote(toReview(rowsIn(nav.course!, section)))}
                onOpen={() => go({ course: nav.course, section })}
              >
                <p className="border-t border-[#edf2ec] pt-3 text-xs font-semibold text-[#203028]">
                  {count} group{count === 1 ? "" : "s"} · {assignments} assignment{assignments === 1 ? "" : "s"}
                </p>
              </Tile>
            );
          })}
        </div>
      )}

      {/* 3. Assignments of the section */}
      {!loading && nav.course && nav.section && !requirement && (
        <>
          {assignmentsOf(nav.course, nav.section).length === 0 && (
            <p className="py-10 text-center text-sm text-[#9aa59e]">No assignments for this section yet. Use New requirement to add one.</p>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignmentsOf(nav.course, nav.section).map((item) => {
              const rows = (rowsById[item.requirement_id] ?? []).filter((row) => row.course === nav.course && row.section === nav.section);
              const isTitle = item.kind === "Title Proposal";

              return (
                <Tile
                  key={item.requirement_id}
                  title={item.title}
                  note={`${item.stage}${item.due_date ? ` · Due ${formatDate(item.due_date)}` : ""}`}
                  review={isTitle ? undefined : reviewNote(toReview(rows))}
                  showReview={!isTitle}
                  onOpen={() => go({ ...nav, requirementId: item.requirement_id })}
                >
                  {isTitle ? (
                    <p className="border-t border-[#edf2ec] pt-3 text-xs font-semibold text-[#203028]">Titles and the Dean&apos;s endorsement</p>
                  ) : (
                    <Progress done={rows.filter((row) => row.submission).length} total={rows.length} />
                  )}
                </Tile>
              );
            })}
          </div>
        </>
      )}

      {/* 4. One assignment: its groups */}
      {!loading && nav.course && nav.section && requirement && (
        <div className="mt-4 rounded-xl border border-[#edf2ec] bg-[#fbfdfb]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf2ec] px-4 py-3">
            <p className="max-w-xl text-xs leading-5 text-[#59645d]">
              {requirement.description || "No instructions were added."}
              {requirement.created_by ? ` — ${requirement.created_by}` : ""}
              {requirement.kind === "Standard" && requirement.submission_type === "File" && (
                <span className="mt-1 block text-[#9aa59e]">{describeFileRules(requirement)}</span>
              )}
              {requirement.attachment_name && (
                <button
                  type="button"
                  onClick={() => void downloadRequirementAttachment(requirement.requirement_id, requirement.attachment_name).catch((err) => setError(errorMessage(err, "Unable to open the file.")))}
                  className="mt-1 block font-semibold text-[#4f8f58] hover:underline"
                >
                  Template: {requirement.attachment_name}
                </button>
              )}
            </p>

            {canEdit(requirement) && (
              <div className="flex gap-3 text-xs font-semibold">
                <button type="button" onClick={() => setDialog({ requirement })} className="text-[#4f8f58] hover:underline">Edit</button>
                {requirement.kind !== "Title Proposal" && (
                  <button type="button" onClick={() => void remove(requirement)} className="text-[#b42318] hover:underline">Delete</button>
                )}
              </div>
            )}
          </div>

          {requirement.kind === "Title Proposal" ? (
            <AdviserTitleReview sections={[label]} onChanged={() => void load()} compact />
          ) : (
            <SectionGroups
              role={role}
              requirement={requirement}
              rows={(rowsById[requirement.requirement_id] ?? []).filter((row) => row.course === nav.course && row.section === nav.section)}
              filter={filter}
              onFilter={setFilter}
              onChanged={(message) => void refresh(message)}
              onError={setError}
            />
          )}
        </div>
      )}

      {dialog && (
        <RequirementDialog
          role={role}
          requirement={dialog.requirement}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void refresh(dialog.requirement ? "Requirement updated." : "Requirement created.");
          }}
        />
      )}
    </div>
  );
}

// The groups of one section for one assignment: filter row on top, then one closed row per group.
function SectionGroups({
  role,
  requirement,
  rows,
  filter,
  onFilter,
  onChanged,
  onError,
}: {
  role: "Adviser" | "Dean";
  requirement: ApiRequirement;
  rows: ApiSubmissionRow[];
  filter: GroupFilter;
  onFilter: (filter: GroupFilter) => void;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const shown = filterRows(requirement, rows, filter);

  return (
    <>
      {rows.length > 1 && (
        <GroupFilterBar groups={rows.map((row) => rowFacts(requirement, row))} filter={filter} onChange={onFilter} shown={shown.length} compact />
      )}
      {rows.length === 0 && <p className="px-4 py-6 text-xs text-[#9aa59e]">No groups to show yet.</p>}
      {rows.length > 0 && shown.length === 0 && <p className="px-4 py-6 text-xs text-[#9aa59e]">No group matches these filters.</p>}
      <ul className="divide-y divide-[#edf2ec]">
        {shown.map((row) => (
          <SubmissionRow key={row.project_id} role={role} requirement={requirement} row={row} onChanged={onChanged} onError={onError} />
        ))}
      </ul>
    </>
  );
}
