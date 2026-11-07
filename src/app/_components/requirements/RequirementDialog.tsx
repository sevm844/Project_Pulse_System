"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "../../_lib/api";
import { COURSE_OPTIONS, errorMessage } from "../../_lib/groups";
import type { ApiRequirement } from "../../_lib/requirements";
import { PROJECT_STAGES } from "../../_utils/projectWorkflow";

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
  const [stage, setStage] = useState(requirement?.stage ?? PROJECT_STAGES[0]);
  const [type, setType] = useState<"File" | "Link">(requirement?.submission_type ?? "File");
  const [dueDate, setDueDate] = useState(requirement?.due_date ?? "");
  const [course, setCourse] = useState(requirement?.course ?? "");
  const [grammar, setGrammar] = useState(requirement?.needs_grammar_check ?? false);
  const [finalOutput, setFinalOutput] = useState(requirement?.is_final_output ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch(
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
          }),
        },
      );

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
          {requirement ? "Edit requirement" : "New requirement"}
        </h2>
        <p className="mt-1 text-xs text-[#7b877f]">
          {role === "Adviser"
            ? "Students in your groups will see this in their Requirements."
            : "Students will see this in their Requirements."}
        </p>

        <div className="mt-5 space-y-4">
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

          <label className="block text-xs font-semibold text-[#59645d]">
            Instructions (optional)
            <textarea
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-[#59645d]">
              Stage
              <select value={stage} onChange={(event) => setStage(event.target.value)} className={fieldClass}>
                {PROJECT_STAGES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-[#59645d]">
              Due date
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} />
            </label>
          </div>

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
            disabled={saving || !title.trim()}
            className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
          >
            {saving ? "Saving..." : requirement ? "Save changes" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
