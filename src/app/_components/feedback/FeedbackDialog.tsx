"use client";

import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import CloseX from "../CloseX";

const fieldClass =
  "w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]";

// Testers report a problem they found. Only bugs are collected: nobody is there to answer suggestions or questions.
export default function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const page = usePathname();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch("/feedback", { method: "POST", body: JSON.stringify({ category: "Bug", message: message.trim(), page }) });
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(errorMessage(err, "Unable to send your report."));
    }

    setSaving(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f2a24]/45 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report a bug"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(31,42,36,0.25)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-[#203028]">Report a bug</h2>
            <p className="mt-1 text-xs text-[#7b877f]">Something broken or wrong? Tell us and it goes to the Dean&apos;s office.</p>
          </div>
          <CloseX onClick={onClose} />
        </div>

        <form onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="block text-xs font-semibold text-[#59645d]">
            What went wrong?
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
              Thank you. Your report was sent. You can send another.
            </p>
          )}

          <button
            type="submit"
            disabled={saving || message.trim().length < 10}
            className="rounded-lg bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
          >
            {saving ? "Sending..." : "Send report"}
          </button>
          {message.trim().length > 0 && message.trim().length < 10 && (
            <span className="ml-3 text-[11px] text-[#9aa59e]">Write at least 10 characters.</span>
          )}
        </form>
      </div>
    </div>,
    document.body,
  );
}
