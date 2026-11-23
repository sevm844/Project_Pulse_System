"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, downloadRequirementAttachment } from "../../_lib/api";
import { COURSE_OPTIONS, errorMessage, type ApiGroup } from "../../_lib/groups";
import { FILE_TYPES, type ApiRequirement } from "../../_lib/requirements";
import { REQUIREMENT_STAGES } from "../../_utils/projectWorkflow";

// A dropdown with checkboxes: pick the sections an assignment is for. Nothing picked = all of them.
function SectionPicker({
  options,
  value,
  onChange,
}: {
  options: string[] | null;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const summary = value.length === 0 ? "All my sections" : value.join(", ");

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${fieldClass} flex items-center justify-between gap-3 text-left`}
      >
        <span className="truncate">{summary}</span>
        <span aria-hidden className="text-xs text-[#9aa59e]">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#dfe8df] bg-white py-1">
          <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-[#203028] hover:bg-[#f3f7f1]">
            <input type="checkbox" checked={value.length === 0} onChange={() => onChange([])} />
            All my sections
          </label>

          {(options ?? []).map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-[#203028] hover:bg-[#f3f7f1]"
            >
              <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} />
              {option}
            </label>
          ))}

          {options === null && <p className="px-3 py-2 text-xs text-[#9aa59e]">Loading your sections...</p>}
          {options?.length === 0 && <p className="px-3 py-2 text-xs text-[#9aa59e]">Create a group to see its section here.</p>}
        </div>
      )}
    </div>
  );
}

const SIZES = [5, 10, 25, 50, 100];
const ATTACHMENT_LIMIT = 3;

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]";

const cardClass = "rounded-xl border border-[#dfe8df] bg-white p-4 sm:p-5";
const labelClass = "block text-sm font-semibold text-[#203028]";
const hintClass = "mt-0.5 block text-xs font-normal leading-5 text-[#7b877f]";

type Props = {
  role: "Adviser" | "Dean";
  requirement?: ApiRequirement;
  onClose: () => void;
  onSaved: () => void;
};

export default function RequirementDialog({ role, requirement, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(requirement?.title ?? "");
  const [description, setDescription] = useState(requirement?.description ?? "");
  const [stage, setStage] = useState(requirement?.stage ?? REQUIREMENT_STAGES[0]);
  // New assignments are always a file. An older assignment that asks for a link keeps asking for one.
  const type: "File" | "Link" = requirement?.submission_type ?? "File";
  const [dueDate, setDueDate] = useState(requirement?.due_date ?? "");
  const [course, setCourse] = useState(requirement?.course ?? "");
  const [grammar, setGrammar] = useState(requirement?.needs_grammar_check ?? false);
  const [finalOutput, setFinalOutput] = useState(requirement?.is_final_output ?? false);
  const [sections, setSections] = useState<string[]>(requirement?.sections ?? []);
  const [allowedTypes, setAllowedTypes] = useState<string[]>(requirement?.allowed_types ?? FILE_TYPES);
  const [maxMb, setMaxMb] = useState(requirement?.max_file_mb ?? 25);
  const [resubmit, setResubmit] = useState(requirement?.allow_resubmission ?? true);
  // Up to 3 template or guide files: the ones already saved (some may be marked for removal) and the ones just chosen.
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const keptFiles = (requirement?.attachments ?? []).filter((file) => !removedIds.includes(file.attachment_id));
  const filesLeft = ATTACHMENT_LIMIT - keptFiles.length - newFiles.length;
  const [sectionOptions, setSectionOptions] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The built-in Title Proposal keeps its name and rules: only the instructions, due date and sections change.
  const isTitle = requirement?.kind === "Title Proposal";

  // An adviser picks from the sections she actually advises.
  useEffect(() => {
    if (role !== "Adviser") return;
    let cancelled = false;

    apiFetch<ApiGroup[]>("/groups")
      .then((groups) => {
        if (cancelled) return;
        const labels = groups.filter((group) => group.group_status !== "Closed").map((group) => `${group.course} ${group.section}`);
        setSectionOptions([...new Set([...labels, ...(requirement?.sections ?? [])])].sort());
      })
      .catch(() => {
        if (!cancelled) setSectionOptions(requirement?.sections ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [role, requirement]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const saved = await apiFetch<ApiRequirement>(
        requirement ? `/requirements/${requirement.requirement_id}` : "/requirements",
        {
          method: requirement ? "PUT" : "POST",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            stage,
            submission_type: type,
            due_date: dueDate || null,
            course: role === "Dean" ? course || null : null,
            // Sending a group's documents on to the Grammarian or the Dean's Secretary is the Dean's job: only the Dean's form has these two.
            ...(role === "Dean" ? { needs_grammar_check: grammar, is_final_output: finalOutput } : {}),
            sections: role === "Adviser" && sections.length > 0 ? sections : null,
            allowed_types: allowedTypes.length === FILE_TYPES.length ? null : allowedTypes,
            max_file_mb: maxMb,
            allow_resubmission: resubmit,
          }),
        },
      );

      // The template files are separate uploads, sent once the assignment exists (removed ones first, so their places are free).
      for (const id of removedIds) {
        await apiFetch(`/requirements/${saved.requirement_id}/attachment/${id}`, { method: "DELETE" });
      }

      for (const file of newFiles) {
        const body = new FormData();
        body.append("file", file);
        await apiFetch(`/requirements/${saved.requirement_id}/attachment`, { method: "POST", body });
      }

      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Unable to save the requirement."));
      setSaving(false);
    }
  }

  const sizes = SIZES.includes(maxMb) ? SIZES : [...SIZES, maxMb].sort((a, b) => a - b);
  const fileRules = !isTitle && type === "File";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2a24]/40 p-3 sm:p-6">
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="requirement-dialog-title"
        className={`flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(31,42,36,0.22)] ${isTitle ? "max-w-2xl" : role === "Dean" ? "max-w-7xl" : "max-w-6xl"}`}
      >
        <header className="shrink-0 border-b border-[#edf2ec] px-6 py-3 sm:px-8">
          <h2 id="requirement-dialog-title" className="text-xl font-semibold text-[#203028]">
            {isTitle ? "Title Proposal" : requirement ? "Edit assignment" : "New assignment"}
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            {isTitle
              ? "This is every group's first assignment. Add your directions for the title proposal."
              : role === "Adviser"
                ? "Students in the sections you pick will see this in their Requirements."
                : "Students will see this in their Requirements."}
          </p>
        </header>

        <div className={`grid min-h-0 flex-1 gap-5 overflow-y-auto bg-[#f8faf7] p-5 sm:p-6 ${isTitle ? "" : role === "Dean" ? "lg:grid-cols-2 xl:grid-cols-[1fr_1.3fr_0.85fr]" : "lg:grid-cols-2"}`}>
          <section className={`${cardClass} space-y-4`}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa59e]">{isTitle ? "Directions" : "1 · About the assignment"}</h3>

            {!isTitle && (
              <label className={labelClass}>
                Title
                <input
                  required
                  maxLength={150}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g., Chapter 1 draft"
                  className={fieldClass}
                />
              </label>
            )}

            <label className={labelClass}>
              Instructions for students
              <textarea
                rows={isTitle ? 5 : 6}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell your students what to prepare, what format you expect, and what you will look for."
                className={`${fieldClass} resize-none leading-6`}
              />
            </label>

            <div className={isTitle ? "" : "grid gap-4 sm:grid-cols-2"}>
              {!isTitle && (
                <label className={labelClass}>
                  Stage
                  <select value={stage} onChange={(event) => setStage(event.target.value)} className={fieldClass}>
                    {REQUIREMENT_STAGES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className={labelClass}>
                Due date
                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} />
              </label>
            </div>

            {role === "Adviser" && (
              <div>
                <p className={labelClass}>For which sections?</p>
                <div className="mt-1.5">
                  <SectionPicker options={sectionOptions} value={sections} onChange={setSections} />
                </div>
              </div>
            )}

            {role === "Dean" && (
              <label className={labelClass}>
                For which course?
                <select value={course} onChange={(event) => setCourse(event.target.value)} className={fieldClass}>
                  <option value="">All courses</option>
                  {COURSE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item} only
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          {!isTitle && (
            <section className={`${cardClass} space-y-4`}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa59e]">2 · What students hand in</h3>

              {type === "File" ? (
                <>
                  <div>
                    <p className={labelClass}>
                      Accepted files
                      <span className={hintClass}>Press a type to allow it or block it.</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {FILE_TYPES.map((item) => {
                        const on = allowedTypes.includes(item);

                        return (
                          <button
                            key={item}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setAllowedTypes((current) => (on ? current.filter((value) => value !== item) : [...current, item]))}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase transition ${
                              on ? "border-[#123f2b] bg-[#123f2b] text-white" : "border-[#dfe8df] bg-white text-[#7b877f] hover:bg-[#f3f7f1]"
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                    {allowedTypes.length === 0 && <p className="mt-1.5 text-xs text-[#b42318]">Pick at least one file type.</p>}
                  </div>

                  <div>
                    <p className={labelClass}>
                      Biggest file
                      <span className={hintClass}>The largest single file a student can upload.</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          aria-pressed={maxMb === size}
                          onClick={() => setMaxMb(size)}
                          className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ${
                            maxMb === size ? "border-[#123f2b] bg-[#123f2b] text-white" : "border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                          }`}
                        >
                          {size} MB
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 text-sm text-[#203028]">
                    <input type="checkbox" checked={resubmit} onChange={(event) => setResubmit(event.target.checked)} className="mt-1 h-4 w-4" />
                    <span className="font-semibold">
                      Students can replace a file while it waits for review
                      <span className={hintClass}>If off, a new version is accepted only after you ask for changes.</span>
                    </span>
                  </label>
                </>
              ) : (
                <p className="text-sm text-[#59645d]">Students send a link for this assignment.</p>
              )}

              <div className="border-t border-[#edf2ec] pt-4">
                <p className={labelClass}>
                  Template or guide files for students
                  <span className={hintClass}>Optional. Up to {ATTACHMENT_LIMIT} files your students can download, such as a form or an outline.</span>
                </p>

                {(keptFiles.length > 0 || newFiles.length > 0) && (
                  <ul className="mt-3 divide-y divide-[#edf2ec] rounded-lg border border-[#edf2ec]">
                    {keptFiles.map((file) => (
                      <li key={file.attachment_id} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm text-[#203028]">
                        <button
                          type="button"
                          onClick={() => void downloadRequirementAttachment(requirement!.requirement_id, file.attachment_id, file.name)}
                          className="min-w-0 truncate text-left font-semibold text-[#4f8f58] hover:underline"
                        >
                          {file.name}
                        </button>
                        <button type="button" onClick={() => setRemovedIds((current) => [...current, file.attachment_id])} className="shrink-0 text-xs font-semibold text-[#b42318] hover:underline">
                          Remove
                        </button>
                      </li>
                    ))}
                    {newFiles.map((file, index) => (
                      <li key={`new-${index}-${file.name}`} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm text-[#203028]">
                        <span className="min-w-0 truncate">
                          {file.name} <span className="text-xs text-[#9aa59e]">· new</span>
                        </span>
                        <button type="button" onClick={() => setNewFiles((current) => current.filter((_, i) => i !== index))} className="shrink-0 text-xs font-semibold text-[#b42318] hover:underline">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  <label
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold focus-within:ring-2 focus-within:ring-[#123f2b]/30 ${
                      filesLeft > 0 ? "cursor-pointer border-[#123f2b] bg-white text-[#123f2b] hover:bg-[#f4f6f3]" : "cursor-not-allowed border-[#dfe8df] bg-[#f3f7f1] text-[#9aa59e]"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                    </svg>
                    Add a file
                    <input
                      type="file"
                      accept={FILE_TYPES.map((item) => `.${item}`).join(",")}
                      disabled={filesLeft <= 0}
                      onChange={(event) => {
                        const chosen = event.target.files?.[0];
                        event.target.value = "";
                        if (chosen && filesLeft > 0) setNewFiles((current) => [...current, chosen]);
                      }}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-sm text-[#59645d]">
                    {keptFiles.length + newFiles.length} of {ATTACHMENT_LIMIT} files{filesLeft <= 0 ? " (the most allowed)" : ""}
                  </span>
                </div>
              </div>
            </section>
          )}

          {!isTitle && role === "Dean" && (
            <section className={`${cardClass} lg:col-span-2 xl:col-span-1`}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa59e]">3 · After students submit</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                <label className="flex items-start gap-3 text-sm text-[#203028]">
                  <input type="checkbox" checked={grammar} onChange={(event) => setGrammar(event.target.checked)} className="mt-1 h-4 w-4" />
                  <span className="font-semibold">
                    Needs a grammar check
                    <span className={hintClass}>After the review, the Grammarian checks it too.</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-[#203028]">
                  <input type="checkbox" checked={finalOutput} onChange={(event) => setFinalOutput(event.target.checked)} className="mt-1 h-4 w-4" />
                  <span className="font-semibold">
                    Final output
                    <span className={hintClass}>The Dean&apos;s Secretary collects it once it is approved.</span>
                  </span>
                </label>
              </div>
            </section>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#edf2ec] px-6 py-3 sm:px-8">
          <p role="alert" className="min-w-0 text-sm text-[#b42318]">
            {error}
          </p>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#dfe8df] px-5 py-2.5 text-sm font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || (fileRules && allowedTypes.length === 0)}
              className="rounded-lg bg-[#123f2b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
            >
              {saving ? "Saving..." : requirement ? "Save changes" : "Create assignment"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
