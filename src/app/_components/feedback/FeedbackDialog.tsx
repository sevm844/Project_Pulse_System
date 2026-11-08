"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";

type Tab = "feedback" | "survey";

const CATEGORIES = [
  { value: "Bug", hint: "Something is broken or wrong" },
  { value: "Suggestion", hint: "An idea to make it better" },
  { value: "Question", hint: "Something is unclear" },
  { value: "Praise", hint: "Something works well" },
] as const;

const SCALE = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

type Survey = {
  questions: string[];
  response: { answers: number[]; score: number; comment: string | null } | null;
};

const fieldClass =
  "w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]";

// Testers tell us what they found (Feedback) and rate the whole system (the usability survey).
export default function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>("feedback");

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f2a24]/45 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Feedback"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(31,42,36,0.25)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-[#203028]">Help us improve Project Pulse</h2>
            <p className="mt-1 text-xs text-[#7b877f]">Your answers go to the Dean&apos;s office. Thank you for testing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-lg leading-none text-[#59645d] hover:bg-[#f3f7f1]"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex gap-6 border-b border-[#edf2ec] px-6 text-sm" role="tablist">
          {(
            [
              ["feedback", "Send feedback"],
              ["survey", "Rate the system"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 pb-3 transition ${
                tab === id ? "border-[#123f2b] font-semibold text-[#203028]" : "border-transparent text-[#7b877f] hover:text-[#203028]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {tab === "feedback" ? <FeedbackForm page={pathname} /> : <SurveyForm />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FeedbackForm({ page }: { page: string }) {
  const [category, setCategory] = useState<string>("Suggestion");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch("/feedback", { method: "POST", body: JSON.stringify({ category, message: message.trim(), page }) });
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(errorMessage(err, "Unable to send your feedback."));
    }

    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-[#59645d]">What kind of feedback is it?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={category === item.value}
              onClick={() => setCategory(item.value)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                category === item.value ? "border-[#123f2b] bg-[#f2fbef]" : "border-[#dfe8df] bg-white hover:bg-[#f3f7f1]"
              }`}
            >
              <span className="block text-sm font-semibold text-[#203028]">{item.value}</span>
              <span className="block text-[11px] text-[#7b877f]">{item.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="block text-xs font-semibold text-[#59645d]">
        Tell us more
        <textarea
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setSent(false);
          }}
          rows={5}
          maxLength={2000}
          placeholder="What were you trying to do, and what happened?"
          className={`${fieldClass} mt-1.5 resize-none font-normal leading-6`}
        />
      </label>

      <p className="text-[11px] text-[#9aa59e]">
        We also record that you were on <span className="font-semibold">{page}</span>, to help us find the problem.
      </p>

      {error && (
        <p role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {sent && (
        <p role="status" className="text-sm text-[#2f6f3a]">
          Thank you. Your feedback was sent. You can send another.
        </p>
      )}

      <button
        type="submit"
        disabled={saving || message.trim().length < 10}
        className="rounded-lg bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
      >
        {saving ? "Sending..." : "Send feedback"}
      </button>
      {message.trim().length > 0 && message.trim().length < 10 && (
        <span className="ml-3 text-[11px] text-[#9aa59e]">Write at least 10 characters.</span>
      )}
    </form>
  );
}

// The System Usability Scale: ten statements, each answered from 1 (strongly disagree) to 5 (strongly agree).
function SurveyForm() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiFetch<Survey>("/survey")
      .then((result) => {
        if (cancelled) return;
        setSurvey(result);
        setAnswers(result.response?.answers ?? Array(result.questions.length).fill(0));
        setComment(result.response?.comment ?? "");
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Unable to load the survey."));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch("/survey", { method: "POST", body: JSON.stringify({ answers, comment: comment.trim() || null }) });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, "Unable to save your answers."));
    }

    setSaving(false);
  }

  if (error && !survey) {
    return (
      <p role="alert" className="text-sm text-[#b42318]">
        {error}
      </p>
    );
  }

  if (!survey) return <p className="text-sm text-[#7b877f]">Loading...</p>;

  if (done) {
    return (
      <p role="status" className="text-sm leading-6 text-[#2f6f3a]">
        Thank you. Your answers were saved. You can open this tab again later to change them.
      </p>
    );
  }

  const unanswered = answers.filter((value) => value === 0).length;

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-xs leading-5 text-[#7b877f]">
        Ten short statements about the whole system, after you have tried it.
        {survey.response ? " You answered before; saving again replaces your earlier answers." : ""}
      </p>

      <ol className="space-y-5">
        {survey.questions.map((question, index) => (
          <li key={question}>
            <p className="text-sm text-[#203028]">
              {index + 1}. {question}
            </p>
            <div className="mt-2 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={`Statement ${index + 1}`}>
              {SCALE.map((label, value) => (
                <label
                  key={label}
                  title={label}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition ${
                    answers[index] === value + 1 ? "border-[#123f2b] bg-[#f2fbef]" : "border-[#dfe8df] hover:bg-[#f3f7f1]"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${index}`}
                    checked={answers[index] === value + 1}
                    onChange={() => setAnswers((current) => current.map((item, at) => (at === index ? value + 1 : item)))}
                    className="sr-only"
                    aria-label={label}
                  />
                  <span className="text-sm font-semibold text-[#203028]">{value + 1}</span>
                  <span className="hidden text-[10px] leading-3 text-[#7b877f] sm:block">{label}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-[#9aa59e]">1 = strongly disagree, 5 = strongly agree</p>

      <label className="block text-xs font-semibold text-[#59645d]">
        Anything else you want to add? (optional)
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} maxLength={1000} className={`${fieldClass} mt-1.5 resize-none font-normal`} />
      </label>

      {error && (
        <p role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || unanswered > 0}
          className="rounded-lg bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save my answers"}
        </button>
        {unanswered > 0 && (
          <span className="text-[11px] text-[#9aa59e]">
            {unanswered} statement{unanswered === 1 ? "" : "s"} left
          </span>
        )}
      </div>
    </form>
  );
}
