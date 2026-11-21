"use client";

import type { JSONContent } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ManuscriptActivity from "./ManuscriptActivity";
import ManuscriptView from "./ManuscriptView";
import { todayInManila } from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";
import { fetchHistoryContent, fetchManuscriptHistory, type HistoryEntry } from "../../_lib/manuscript";

const COLORS = ["#2f7d4f", "#2563eb", "#c2410c", "#7c3aed", "#0e7490", "#be185d"];
// The same person always gets the same colour dot.
const colorOf = (name: string) => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];

const manilaDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const dayNumber = (date: string) => Math.round(new Date(`${date}T00:00:00Z`).getTime() / 86400000);
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

function dayHeading(date: string) {
  const diff = dayNumber(todayInManila()) - dayNumber(date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
}

// Google Docs' "Version history": opens over the whole screen. The document as it was at the chosen moment on the left, every edit from the very
// first one to now on the right, grouped by day with who edited. Students can restore an earlier copy; the adviser and the Dean only read.
export default function ManuscriptTimeline({
  projectId,
  onClose,
  onRestore,
}: {
  projectId: number;
  onClose: () => void;
  // Only students pass this: replaces the group's draft with the chosen copy.
  onRestore?: (content: JSONContent) => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"edits" | "who">("edits");
  const [onlyVersions, setOnlyVersions] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [opening, setOpening] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchManuscriptHistory(projectId)
      .then((rows) => {
        if (cancelled) return;
        setEntries(rows);
        setSelectedKey(rows[0]?.key ?? null);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to load the history.")));

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selected = useMemo(() => entries?.find((entry) => entry.key === selectedKey) ?? null, [entries, selectedKey]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpening(true);
    setConfirm(false);
    fetchHistoryContent(projectId, selected)
      .then((result) => {
        if (cancelled) return;
        setContent(result.content);
        setError("");
        setOpening(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err, "Unable to open this copy."));
        setOpening(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, selected]);

  // Close with Escape, like any dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const days = useMemo(() => {
    const shown = (entries ?? []).filter((entry) => !onlyVersions || entry.kind === "version");
    const out: { date: string; items: HistoryEntry[] }[] = [];

    for (const entry of shown) {
      const date = manilaDay(entry.at);
      const last = out[out.length - 1];
      if (last?.date === date) last.items.push(entry);
      else out.push({ date, items: [entry] });
    }

    return out;
  }, [entries, onlyVersions]);

  const tabClass = (active: boolean) =>
    `border-b-2 px-1 pb-2 text-sm font-semibold ${active ? "border-[#123f2b] text-[#123f2b]" : "border-transparent text-[#7b877f] hover:text-[#203028]"}`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Version history">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#dfe8df] px-4 py-3">
        <button type="button" onClick={onClose} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
          &larr; Back to the manuscript
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-[#203028]">{selected ? fullDate(selected.at) : "Version history"}</h2>
          {selected && (
            <p className="truncate text-xs text-[#59645d]">
              {selected.kind === "current" ? "The draft as it is now" : selected.kind === "version" ? `Version ${selected.version_no} submitted` : "A saved copy while the group was typing"}
              {" · "}
              {selected.words.toLocaleString("en-PH")} words
            </p>
          )}
        </div>
        {onRestore && selected && selected.kind !== "current" && content && (
          confirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="max-w-sm text-xs text-[#59645d]">The draft your whole group is editing will be replaced, for everyone. What is there now stays in this history.</p>
              <button type="button" onClick={() => setConfirm(false)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRestore(content);
                  onClose();
                }}
                className="rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
              >
                Restore
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]">
              Restore this version
            </button>
          )
        )}
      </div>

      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden">
        <div className="min-h-0 bg-[#eef2ee] lg:overflow-y-auto">
          {error && (
            <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
          {opening && <p className="p-6 text-sm text-[#7b877f]">Opening...</p>}
          {!opening && content && selected && <ManuscriptView key={selected.key} content={content} heightClass="max-h-[calc(100vh-150px)]" />}
          {!entries && !error && <p className="p-6 text-sm text-[#7b877f]">Loading the history...</p>}
          {entries && entries.length === 0 && <p className="p-6 text-sm text-[#7b877f]">Nothing has been typed in this manuscript yet.</p>}
        </div>

        <aside className="flex min-h-0 flex-col border-t border-[#dfe8df] bg-white lg:border-l lg:border-t-0" aria-label="History">
          <div className="border-b border-[#edf2ec] px-4 pt-4">
            <h3 className="text-base font-semibold text-[#203028]">Version history</h3>
            <div className="mt-3 flex gap-5">
              <button type="button" onClick={() => setTab("edits")} className={tabClass(tab === "edits")}>
                Edits
              </button>
              <button type="button" onClick={() => setTab("who")} className={tabClass(tab === "who")}>
                Who worked
              </button>
            </div>
          </div>

          {tab === "edits" ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <label className="mb-3 flex items-center gap-2 text-xs text-[#59645d]">
                <input type="checkbox" checked={onlyVersions} onChange={(event) => setOnlyVersions(event.target.checked)} />
                Only versions that were submitted
              </label>
              {days.length === 0 && entries && entries.length > 0 && <p className="text-xs text-[#7b877f]">No version has been submitted yet.</p>}
              {days.map((day) => (
                <section key={day.date} className="mb-4">
                  <h4 className="mb-1 text-xs font-semibold text-[#203028]">{dayHeading(day.date)}</h4>
                  <ul>
                    {day.items.map((entry) => {
                      const active = entry.key === selectedKey;
                      const names = entry.editors.length > 0 ? entry.editors : entry.saved_by ? [entry.saved_by] : [];

                      return (
                        <li key={entry.key}>
                          <button
                            type="button"
                            onClick={() => setSelectedKey(entry.key)}
                            aria-current={active}
                            className={`w-full rounded-lg px-3 py-2 text-left ${active ? "bg-[#e6f1e8]" : "hover:bg-[#f3f7f1]"}`}
                          >
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-semibold text-[#203028]">{timeOf(entry.at)}</span>
                              <span className="text-[11px] font-semibold text-[#123f2b]">
                                {entry.kind === "current" ? "Current version" : entry.kind === "version" ? `Version ${entry.version_no} · submitted` : ""}
                              </span>
                            </span>
                            {entry.note && <span className="mt-0.5 block break-words text-xs italic text-[#59645d]">&ldquo;{entry.note}&rdquo;</span>}
                            {names.map((name) => (
                              <span key={name} className="mt-0.5 flex items-center gap-2 text-xs text-[#59645d]">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(name) }} aria-hidden />
                                {name}
                              </span>
                            ))}
                            <span className="mt-0.5 block text-[11px] text-[#9aa59e]">{entry.words.toLocaleString("en-PH")} words</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <ManuscriptActivity projectId={projectId} />
            </div>
          )}
        </aside>
      </div>
    </div>,
    document.body,
  );
}
