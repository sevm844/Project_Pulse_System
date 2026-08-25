"use client";

import { useState } from "react";
import PanelistShell from "../_components/PanelistShell";
import Card from "../_components/Card";
import { panelistDefenses } from "../_data/panelistData";

export default function EvaluationFormsPage() {
  const pendingDefense =
    panelistDefenses.find((item) => item.evaluationStatus === "Pending") ||
    panelistDefenses[0];

  const [presentation, setPresentation] = useState(
    pendingDefense.scores.presentation,
  );
  const [documentation, setDocumentation] = useState(
    pendingDefense.scores.documentation,
  );
  const [systemDemo, setSystemDemo] = useState(pendingDefense.scores.systemDemo);
  const [response, setResponse] = useState(pendingDefense.scores.response);
  const [remarks, setRemarks] = useState(pendingDefense.remarks);
  const [submitted, setSubmitted] = useState(false);

  const average = Math.round(
    ([presentation, documentation, systemDemo, response].reduce(
      (sum, score) => sum + Number(score || 0),
      0,
    ) /
      4) ||
      0,
  );

  return (
    <PanelistShell title="Evaluation Forms">
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#203028]">
              {pendingDefense.groupName}
            </h2>
            <p className="mt-1 text-sm text-[#59645d]">
              {pendingDefense.projectTitle}
            </p>
            <p className="mt-2 text-xs text-[#7b877f]">
              {pendingDefense.stage} • {pendingDefense.date} •{" "}
              {pendingDefense.time} • {pendingDefense.venue}
            </p>
          </div>

          <div className="rounded-xl bg-[#f8faf7] px-5 py-4 text-center">
            <p className="text-xs text-[#7b877f]">Average</p>
            <p className="mt-1 text-3xl font-semibold text-[#203028]">
              {average}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ScoreInput
            label="Presentation"
            value={presentation}
            onChange={setPresentation}
          />
          <ScoreInput
            label="Documentation"
            value={documentation}
            onChange={setDocumentation}
          />
          <ScoreInput
            label="System Demo"
            value={systemDemo}
            onChange={setSystemDemo}
          />
          <ScoreInput label="Q&A Response" value={response} onChange={setResponse} />
        </div>

        <label className="mt-5 block text-sm font-semibold text-[#203028]">
          Remarks
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Enter panel remarks and recommendation..."
            className="mt-2 min-h-32 w-full resize-none rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#7b877f]">
            Scores should be reviewed before submitting. Submitted evaluations
            are kept for defense records.
          </p>

          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            Submit Evaluation
          </button>
        </div>

        {submitted && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Evaluation submitted locally.
          </p>
        )}
      </Card>
    </PanelistShell>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-xl bg-[#f8faf7] p-4 text-sm font-semibold text-[#203028]">
      {label}
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-11 w-full rounded-lg border border-[#dfe8df] bg-white px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      />
    </label>
  );
}
