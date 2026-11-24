"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ManuscriptHistory from "./ManuscriptHistory";
import { openGoogleManuscript, submitVersionFromGoogle } from "../../_lib/googleManuscript";
import { errorMessage } from "../../_lib/groups";
import { fetchMyManuscript } from "../../_lib/manuscript";

// The manuscript written in Google Docs: one document for the whole group, made and shared by the system. The students write in Google's own editor
// (a new tab). Submit version here saves a FROZEN COPY in the system (text + the exact PDF); the Dean and the advisers read and comment on that copy.
export default function GoogleManuscriptPanel({ docUrl }: { docUrl: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchMyManuscript()
      .then((loaded) => {
        if (!cancelled) setProjectId(loaded.project_id);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  async function open() {
    // The tab is opened first, inside the click, so the pop-up blocker lets it through.
    const tab = window.open("", "_blank");
    setBusy(true);
    setError("");

    try {
      const result = await openGoogleManuscript();
      setShared(true);
      if (tab) tab.location.href = result.doc_url;
      else window.location.assign(result.doc_url);
    } catch (err) {
      tab?.close();
      setError(errorMessage(err, "Could not open the Google Doc."));
    }

    setBusy(false);
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");

    try {
      const result = await submitVersionFromGoogle(note);
      setDone(
        `Version ${result.version.version_no} was saved.` +
          (result.skippedPictures > 0 ? ` ${result.skippedPictures} picture(s) could not be copied: they stay in your Google Doc.` : "") +
          (result.hasPdf ? "" : " The exact PDF could not be kept this time."),
      );
      setSubmitOpen(false);
      setNote("");
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSubmitError(errorMessage(err, "Could not save the version."));
    }

    setSubmitting(false);
  }

  const primary = "rounded-lg bg-[#123f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60";
  const secondary = "rounded-lg border border-[#cfe0d3] bg-white px-5 py-2.5 text-sm font-semibold text-[#123f2b] hover:bg-[#f3f8f4] disabled:opacity-60";

  return (
    <section className="max-w-3xl rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
      <h2 className="text-xl font-semibold tracking-tight text-[#203028]">Your group&apos;s manuscript</h2>
      <p className="mt-2 text-sm leading-6 text-[#59645d]">
        You and your groupmates write the manuscript together in Google Docs. Everyone in your group gets access with their UB e-mail, so sign in to Google with it.
        When a part is ready, press <span className="font-semibold">Submit version</span> here: the system saves a frozen copy that your Dean and your advisers read and comment on.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void open()} disabled={busy} className={primary}>
          {busy ? "Opening..." : docUrl || shared ? "Open in Google Docs" : "Create and open in Google Docs"}
        </button>
        {(docUrl || shared) && (
          <button
            type="button"
            onClick={() => {
              setSubmitError("");
              setDone("");
              setSubmitOpen(true);
            }}
            className={secondary}
          >
            Submit version
          </button>
        )}
        <button type="button" disabled={projectId === null} onClick={() => setVersionsOpen(true)} className={secondary}>
          Versions
        </button>
      </div>
      <p className="mt-2 text-xs text-[#7b877f]">The Google Doc opens in a new tab.</p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#b42318]">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-3 text-sm font-semibold text-[#1d6b34]">
          {done}
        </p>
      )}

      {submitOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div role="dialog" aria-modal="true" aria-label="Submit version" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#203028]">Submit a version</h3>
              <p className="mt-1 text-sm leading-6 text-[#7b877f]">
                The system takes a copy of your Google Doc as it is right now and freezes it. Later changes in Google do not change it. Your Dean and your advisers read this copy.
              </p>
              <label className="mt-4 block text-xs font-semibold text-[#203028]">
                Note (optional)
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={300}
                  placeholder="For example: Chapter 1 and 2 revised"
                  className="mt-1 w-full rounded-lg border border-[#dfe8df] px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>
              {submitError && (
                <p role="alert" className="mt-3 text-xs font-semibold text-[#b42318]">
                  {submitError}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setSubmitOpen(false)} disabled={submitting} className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]">
                  Cancel
                </button>
                <button type="button" onClick={() => void submit()} disabled={submitting} className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0d3322] disabled:opacity-60">
                  {submitting ? "Saving the copy..." : "Submit version"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {versionsOpen &&
        projectId !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div role="dialog" aria-modal="true" aria-label="Versions" className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[#203028]">Your submitted versions</h3>
                <button type="button" onClick={() => setVersionsOpen(false)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ManuscriptHistory projectId={projectId} plainDownload reloadKey={reloadKey} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
