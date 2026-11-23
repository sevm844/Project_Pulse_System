"use client";

import { useCallback, useEffect, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import { apiFetch } from "../../../_lib/api";
import { errorMessage } from "../../../_lib/groups";

type EmailStatus = {
  mailer: string;
  delivers: boolean;
  from_address: string;
  site_url: string;
  problems: string[];
};

// The Dean checks that the system really sends emails (defense and assignment notices, password links, account invitations).
export default function EmailCheckPage() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await apiFetch<EmailStatus>("/email-check"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to check the email settings."));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function sendTest() {
    setBusy(true);
    setResult(null);

    try {
      const answer = await apiFetch<{ sent: boolean; message: string }>("/email-check/test", { method: "POST" });
      setResult({ ok: answer.sent, text: answer.message });
    } catch (err) {
      setResult({ ok: false, text: errorMessage(err, "The test email could not be sent.") });
    }

    setBusy(false);
  }

  const healthy = status && status.delivers && status.problems.length === 0;

  return (
    <DeanShell title="Email Check">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">Email Check</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Defense schedules, assignments, reminders, password links and account invitations all go out by email as well as inside the system. Use this page to make sure the emails really reach people.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}

        {status && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6">
              <p className={`text-lg font-semibold ${healthy ? "text-[#1d6b34]" : "text-[#b42318]"}`}>
                {healthy ? "Emails are set up to be sent" : "Emails are NOT reaching people yet"}
              </p>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-[#edf2ec] pb-2">
                  <dt className="text-[#7b877f]">Mail method</dt>
                  <dd className="font-semibold text-[#203028]">{status.mailer}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#edf2ec] pb-2">
                  <dt className="text-[#7b877f]">Sent from</dt>
                  <dd className="font-semibold text-[#203028]">{status.from_address || "not set"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#7b877f]">Website address in emails</dt>
                  <dd className="break-all text-right font-semibold text-[#203028]">{status.site_url}</dd>
                </div>
              </dl>

              {status.problems.length > 0 && (
                <ul className="mt-5 space-y-2 text-sm leading-6 text-[#b42318]">
                  {status.problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-6">
              <p className="text-lg font-semibold text-[#203028]">Send yourself a test email</p>
              <p className="mt-2 text-sm leading-6 text-[#59645d]">
                We send one short message to your own email address. If it arrives, students, advisers and panelists will receive their notices too. Check the spam folder if you do not see it.
              </p>

              <button
                type="button"
                onClick={() => void sendTest()}
                disabled={busy}
                className="mt-5 rounded-lg bg-[#123f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send me a test email"}
              </button>

              {result && (
                <p role="status" className={`mt-4 text-sm leading-6 ${result.ok ? "text-[#1d6b34]" : "text-[#b42318]"}`}>
                  {result.text}
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </DeanShell>
  );
}
