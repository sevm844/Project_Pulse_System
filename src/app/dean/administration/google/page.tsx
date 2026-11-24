"use client";

import { useCallback, useEffect, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import { fetchGoogleCheck, testGoogleConnection, type GoogleCheck } from "../../../_lib/googleManuscript";
import { errorMessage } from "../../../_lib/groups";

// The Dean checks that the manuscript can be written in Google Docs: the switch, the Google key, and a real connection test.
export default function GoogleCheckPage() {
  const [status, setStatus] = useState<GoogleCheck | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await fetchGoogleCheck());
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to check the Google Docs settings."));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function runTest() {
    setBusy(true);
    setResult(null);

    try {
      const answer = await testGoogleConnection();
      setResult({ ok: answer.ok, text: answer.message });
    } catch (err) {
      setResult({ ok: false, text: errorMessage(err, "The connection test failed.") });
    }

    setBusy(false);
  }

  const ready = status && status.enabled && status.key_present;

  return (
    <DeanShell title="Google Docs Check">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">Google Docs Check</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            When this is switched on, each group writes its manuscript in Google Docs: the system makes one document per group and shares it with the members by their UB e-mails. Use this page to see whether the connection is ready.
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
              <p className={`text-lg font-semibold ${ready ? "text-[#1d6b34]" : "text-[#b42318]"}`}>
                {ready ? "Google Docs is switched on" : "Google Docs is NOT in use yet"}
              </p>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-[#edf2ec] pb-2">
                  <dt className="text-[#7b877f]">Switch (MANUSCRIPT_EDITOR)</dt>
                  <dd className="font-semibold text-[#203028]">{status.enabled ? "google" : "off: the system's own editor"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#edf2ec] pb-2">
                  <dt className="text-[#7b877f]">Google key</dt>
                  <dd className="font-semibold text-[#203028]">{status.key_present ? "present" : "missing"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#edf2ec] pb-2">
                  <dt className="text-[#7b877f]">Robot account</dt>
                  <dd className="break-all text-right font-semibold text-[#203028]">{status.service_email ?? "not set"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#7b877f]">Folder for the documents</dt>
                  <dd className="font-semibold text-[#203028]">{status.folder_set ? "set" : "not set (the robot's own Drive)"}</dd>
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
              <p className="text-lg font-semibold text-[#203028]">Test the connection</p>
              <p className="mt-2 text-sm leading-6 text-[#59645d]">
                The system signs in to Google, makes one empty test document and deletes it at once. It touches no group and no student.
              </p>

              <button
                type="button"
                onClick={() => void runTest()}
                disabled={busy || !status.key_present}
                className="mt-5 rounded-lg bg-[#123f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
              >
                {busy ? "Testing..." : "Test now"}
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
