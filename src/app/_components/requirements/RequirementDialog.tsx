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
  options: string[];
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

          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-[#203028] hover:bg-[#f3f7f1]"
            >
              <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} />
              {option}
            </label>
          ))}

          {options.length === 0 && <p className="px-3 py-2 text-xs text-[#9aa59e]">Create a group to see its section here.</p>}
        </div>
      )}
    </div>
  );
}

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

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
  const [type, setType] = useState<"File" | "Link">(requirement?.submission_type ?? "File");
  const [dueDate, setDueDate] = useState(requirement?.due_date ?? "");
  const [course, setCourse] = useState(requirement?.course ?? "");
  const [grammar, setGrammar] = useState(requirement?.needs_grammar_check ?? false);
  const [finalOutput, setFinalOutput] = useState(requirement?.is_final_output ?? false);
  const [sections, setSections] = useState<string[]>(requirement?.sections ?? []);
  const [allowedTypes, setAllowedTypes] = useState<string[]>(requirement?.allowed_types ?? FILE_TYPES);
  const [maxMb, setMaxMb] = useState(requirement?.max_file_mb ?? 10);
  const [resubmit, setResubmit] = useState(requirement?.allow_resubmission ?? true);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
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
            needs_grammar_check: grammar,
            is_final_output: finalOutput,
            sections: role === "Adviser" && sections.length > 0 ? sections : null,
            allowed_types: allowedTypes.length === FILE_TYPES.length ? null : allowedTypes,
            max_file_mb: maxMb,
            allow_resubmission: resubmit,
          }),
        },
      );

      // The template is a separate upload, sent once the assignment exists.
      if (attachment) {
        const body = new FormData();
        body.append("file", attachment);
        await apiFetch(`/requirements/${saved.requirement_id}/attachment`, { method: "POST", body });
      } else if (removeAttachment && requirement?.attachment_name) {
        await apiFetch(`/requirements/${saved.requirement_id}/attachment`, { method: "DELETE" });
      }

      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Unable to save the requirement."));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2a24]/40 p-4">
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="requirement-dialog-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(31,42,36,0.22)]"
      >
        <h2 id="requirement-dialog-title" className="text-lg font-semibold text-[#203028]">
          {isTitle ? "Title Proposal" : requirement ? "Edit requirement" : "New requirement"}
        </h2>
        <p className="mt-1 text-xs text-[#7b877f]">
          {isTitle
            ? "This is every group's first assignment. Add your directions for the title proposal."
            : role === "Adviser"
              ? "Students in the sections you pick will see this in their Requirements."
              : "Students will see this in their Requirements."}
        </p>

        <div className="mt-5 space-y-4">
          {!isTitle && (
            <label className="block text-xs font-semibold text-[#59645d]">
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

          <label className="block text-xs font-semibold text-[#59645d]">
            Instructions for students
            <textarea
              rows={5}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell your students what to prepare, what format you expect, and what you will look for."
              className={`${fieldClass} resize-none leading-6`}
            />
          </label>

          <div className={isTitle ? "" : "grid grid-cols-2 gap-3"}>
            {!isTitle && (
              <label className="block text-xs font-semibold text-[#59645d]">
                Stage
                <select value={stage} onChange={(event) => setStage(event.target.value)} className={fieldClass}>
                  {REQUIREMENT_STAGES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-xs font-semibold text-[#59645d]">
              Due date
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} />
            </label>
          </div>

          {role === "Adviser" && (
            <div>
              <p className="text-xs font-semibold text-[#59645d]">For which sections?</p>
              <div className="mt-1.5">
                <SectionPicker options={sectionOptions} value={sections} onChange={setSections} />
              </div>
            </div>
          )}

          {!isTitle && (
          <div>
            <p className="text-xs font-semibold text-[#59645d]">Students submit</p>
            <div className="mt-1.5 inline-flex rounded-lg border border-[#dfe8df] p-0.5 text-xs font-semibold">
              {(["File", "Link"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setType(item)}
                  className={`rounded-md px-4 py-1.5 transition ${
                    type === item ? "bg-[#123f2b] text-white" : "text-[#59645d] hover:bg-[#f3f7f1]"
                  }`}
                >
                  {item === "File" ? "A file" : "A link"}
                </button>
              ))}
            </div>
          </div>

          )}

          {!isTitle && type === "File" && (
            <div className="space-y-4 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4">
              <div>
                <p className="text-xs font-semibold text-[#59645d]">Accepted files</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {FILE_TYPES.map((item) => {
                    const on = allowedTypes.includes(item);

                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setAllowedTypes((current) =>
                            on ? current.filter((value) => value !== item) : [...current, item],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase transition ${
                          on
                            ? "border-[#123f2b] bg-[#123f2b] text-white"
                            : "border-[#dfe8df] bg-white text-[#7b877f] hover:bg-[#f3f7f1]"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                {allowedTypes.length === 0 && (
                  <p className="mt-1.5 text-xs text-[#b42318]">Pick at least one file type.</p>
                )}
              </div>

              <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3">
                <label htmlFor="max-file-mb" className="text-xs font-semibold text-[#59645d]">
                  Biggest file
                </label>
                <select
                  id="max-file-mb"
                  value={maxMb}
                  onChange={(event) => setMaxMb(Number(event.target.value))}
                  className="w-28 rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                >
                  {[1, 2, 5, 10].map((size) => (
                    <option key={size} value={size}>
                      {size} MB
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-[#203028]">
                <input type="checkbox" checked={resubmit} onChange={(event) => setResubmit(event.target.checked)} className="mt-1" />
                <span>
                  Students can replace a file while it waits for review
                  <span className="block text-xs text-[#7b877f]">If off, a new version is accepted only after you ask for changes.</span>
                </span>
              </label>
            </div>
          )}

          {!isTitle && (
            <div>
              <p className="text-xs font-semibold text-[#59645d]">Template or guide for students (optional)</p>

              {requirement?.attachment_name && !removeAttachment && !attachment && (
                <p className="mt-1.5 flex items-center gap-3 text-xs text-[#59645d]">
                  <button
                    type="button"
                    onClick={() => void downloadRequirementAttachment(requirement.requirement_id, requirement.attachment_name)}
                    className="font-semibold text-[#4f8f58] hover:underline"
                  >
                    {requirement.attachment_name}
                  </button>
                  <button type="button" onClick={() => setRemoveAttachment(true)} className="text-[#b42318] hover:underline">
                    Remove
                  </button>
                </p>
              )}

              <input
                type="file"
                accept={FILE_TYPES.map((item) => `.${item}`).join(",")}
                onChange={(event) => {
                  setAttachment(event.target.files?.[0] ?? null);
                  setRemoveAttachment(false);
                }}
                className="mt-1.5 block w-full text-xs text-[#59645d] file:mr-3 file:rounded-lg file:border file:border-[#dfe8df] file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#203028] hover:file:bg-[#f3f7f1]"
              />
              {requirement?.attachment_name && attachment && (
                <p className="mt-1 text-xs text-[#7b877f]">This replaces {requirement.attachment_name}.</p>
              )}
            </div>
          )}

          {role === "Dean" && (
            <label className="block text-xs font-semibold text-[#59645d]">
              For
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

          {!isTitle && (
          <div className="space-y-2.5 text-sm text-[#203028]">
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={grammar} onChange={(event) => setGrammar(event.target.checked)} className="mt-1" />
              <span>
                Needs a grammar check
                <span className="block text-xs text-[#7b877f]">After you approve it, the Grammarian reviews it too.</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={finalOutput} onChange={(event) => setFinalOutput(event.target.checked)} className="mt-1" />
              <span>
                Final output
                <span className="block text-xs text-[#7b877f]">The Research Coordinator collects it once it is approved.</span>
              </span>
            </label>
          </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || (!isTitle && type === "File" && allowedTypes.length === 0)}
            className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
          >
            {saving ? "Saving..." : requirement ? "Save changes" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
