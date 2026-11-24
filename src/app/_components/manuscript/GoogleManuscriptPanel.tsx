"use client";

import { useState } from "react";
import { openGoogleManuscript } from "../../_lib/googleManuscript";
import { errorMessage } from "../../_lib/groups";

// The manuscript written in Google Docs: one document for the whole group, made and shared by the system. The students write in Google's own editor
// (a new tab) and the system freezes copies of it when they press Submit version (next step), so the Dean and the advisers read and comment here.
export default function GoogleManuscriptPanel({ docUrl }: { docUrl: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);

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

  return (
    <section className="max-w-3xl rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
      <h2 className="text-xl font-semibold tracking-tight text-[#203028]">Your group&apos;s manuscript</h2>
      <p className="mt-2 text-sm leading-6 text-[#59645d]">
        You and your groupmates write the manuscript together in Google Docs. Everyone in your group gets access with their UB e-mail, so sign in to Google with it.
        When a part is ready, press Submit version here: the system saves a frozen copy that your Dean and your advisers read and comment on.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void open()}
          disabled={busy}
          className="rounded-lg bg-[#123f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
        >
          {busy ? "Opening..." : docUrl || shared ? "Open in Google Docs" : "Create and open in Google Docs"}
        </button>
        <span className="text-xs text-[#7b877f]">It opens in a new tab.</span>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#b42318]">
          {error}
        </p>
      )}
    </section>
  );
}
