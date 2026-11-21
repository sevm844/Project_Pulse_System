"use client";

import type { JSONContent } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BlockView, ChangeRow } from "./ManuscriptCompare";
import ManuscriptView from "./ManuscriptView";
import { todayInManila } from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";
import { fetchHistoryContent, fetchManuscriptHistory, type HistoryEntry } from "../../_lib/manuscript";
import { compareDocuments, toSections } from "../../_lib/manuscriptDiff";

const COLORS = ["#2f7d4f", "#2563eb", "#c2410c", "#7c3aed", "#0e7490", "#be185d"];
// The same person always gets the same colour dot.
const colorOf = (name: string) => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];

const manilaDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const dayNumber = (date: string) => Math.round(new Date(`${date}T00:00:00Z`).getTime() / 86400000);
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
const number = (n: number) => n.toLocaleString("en-PH");

function dayHeading(date: string) {
  const diff = dayNumber(todayInManila()) - dayNumber(date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
}

type Loaded = { key: string; prevKey: string | null; content: JSONContent; prev: JSONContent | null };

// Google Docs' "Version history": opens over the whole screen. On the right, every edit from the very first one to now, grouped by day with who edited.
// On the left, the document at the chosen moment with what that edit added (green) and removed (red) compared with the entry before it; "Show changes"
// off shows the plain pages instead. Students can restore an earlier copy; the adviser and the Dean only read.
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
  const [onlyVersions, setOnlyVersions] = useState(false);
  const [showChanges, setShowChanges] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const cache = useRef(new Map<string, JSONContent>());

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

  const shown = useMemo(() => (entries ?? []).filter((entry) => !onlyVersions || entry.kind === "version"), [entries, onlyVersions]);
  const selected = useMemo(() => entries?.find((entry) => entry.key === selectedKey) ?? null, [entries, selectedKey]);
  // The entry just before this one in the list: what "added" and "removed" are measured against.
  const previous = useMemo(() => {
    const at = shown.findIndex((entry) => entry.key === selectedKey);

    return at >= 0 ? (shown[at + 1] ?? null) : null;
  }, [shown, selectedKey]);
  const previousKey = showChanges ? (previous?.key ?? null) : null;

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;

    async function open(entry: HistoryEntry) {
      const hit = cache.current.get(entry.key);
      if (hit) return hit;
      const result = await fetchHistoryContent(projectId, entry);
      // The draft "now" can move on; every other copy is fixed.
      if (entry.kind !== "current") cache.current.set(entry.key, result.content);

      return result.content;
    }

    Promise.all([open(selected), showChanges && previous ? open(previous) : Promise.resolve(null)])
      .then(([content, prev]) => {
        if (cancelled) return;
        setLoaded({ key: selected.key, prevKey: previousKey, content, prev });
        setError("");
        setExpanded(new Set());
        setConfirm(false);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to open this copy.")));

    return () => {
      cancelled = true;
    };
  }, [projectId, selected, previous, previousKey, showChanges]);

  // Close with Escape, like any dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const days = useMemo(() => {
    const out: { date: string; items: HistoryEntry[] }[] = [];

    for (const entry of shown) {
      const date = manilaDay(entry.at);
      const last = out[out.length - 1];
      if (last?.date === date) last.items.push(entry);
      else out.push({ date, items: [entry] });
    }

    return out;
  }, [shown]);

  const ready = loaded && loaded.key === selectedKey && loaded.prevKey === previousKey ? loaded : null;
  const diff = useMemo(() => (ready?.prev ? compareDocuments(ready.prev, ready.content) : null), [ready]);
  const sections = useMemo(() => (diff ? toSections(diff.rows, true, expanded) : []), [diff, expanded]);
  const changeCount = diff ? diff.rows.filter((row) => row.type !== "same").length : 0;

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
              {number(selected.words)} words
              {selected.editors.length > 0 && ` · edited by ${selected.editors.join(", ")}`}
            </p>
          )}
        </div>
        {onRestore && selected && selected.kind !== "current" && ready && (
          confirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="max-w-sm text-xs text-[#59645d]">The draft your whole group is editing will be replaced, for everyone. What is there now stays in this history.</p>
              <button type="button" onClick={() => setConfirm(false)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRestore(ready.content);
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
          {!entries && !error && <p className="p-6 text-sm text-[#7b877f]">Loading the history...</p>}
          {entries && entries.length === 0 && <p className="p-6 text-sm text-[#7b877f]">Nothing has been typed in this manuscript yet.</p>}
          {selected && !ready && !error && <p className="p-6 text-sm text-[#7b877f]">Opening...</p>}

          {ready && selected && (
            <>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-[#dfe8df] bg-white px-4 py-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#203028]">
                  <input type="checkbox" checked={showChanges} onChange={(event) => setShowChanges(event.target.checked)} className="h-4 w-4 accent-[#123f2b]" />
                  Show changes
                </label>
                {showChanges && diff && (
                  <>
                    <p className="flex items-center gap-3 text-[11px] text-[#59645d]" aria-label="Legend">
                      <mark className="rounded bg-emerald-100 px-1 text-emerald-900 underline decoration-emerald-500">Added</mark>
                      <mark className="rounded bg-red-100 px-1 text-red-800 line-through">Removed</mark>
                    </p>
                    <p className="ml-auto text-xs font-semibold" aria-label="Words changed">
                      <span className="text-emerald-700">+{number(diff.stats.wordsAdded)} words</span>
                      <span className="mx-1.5 text-[#c4cec7]">|</span>
                      <span className="text-red-700">&minus;{number(diff.stats.wordsRemoved)} words</span>
                    </p>
                  </>
                )}
              </div>

              {showChanges && diff ? (
                <div className="p-3 sm:p-5">
                  <article className="mx-auto max-w-3xl rounded-lg bg-white px-5 py-6 text-[14px] leading-relaxed text-[#1f2a24] shadow-sm sm:px-9">
                    <p className="mb-4 text-xs text-[#7b877f]">Compared with the entry before it ({fullDate(previous!.at)}).</p>
                    {changeCount === 0 && (
                      <p className="mb-5 rounded-lg border border-[#dfe8df] bg-[#f8faf7] p-4 text-sm text-[#59645d]">
                        The words are the same as in the entry before. Only formatting (fonts, sizes or spacing) may differ.
                      </p>
                    )}
                    {sections.map((section) => {
                      if (section.kind === "change") return <ChangeRow key={`c${section.index}`} row={section.row} index={section.index} active={false} />;
                      if (section.kind === "folded") {
                        return (
                          <button
                            key={`f${section.id}`}
                            type="button"
                            onClick={() => setExpanded((set) => new Set(set).add(section.id))}
                            className="my-3 w-full rounded-lg border border-dashed border-[#cfd9d1] bg-[#f8faf7] px-3 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f0f5ee]"
                          >
                            {section.count} unchanged {section.count === 1 ? "paragraph" : "paragraphs"} &middot; Show
                          </button>
                        );
                      }

                      return section.rows.map((row, i) => row.type === "same" && <BlockView key={`s${section.id}-${i}`} block={row.block} />);
                    })}
                  </article>
                </div>
              ) : (
                <>
                  {showChanges && !previous && (
                    <p className="border-b border-[#dfe8df] bg-[#f8faf7] px-4 py-2 text-xs text-[#59645d]">This is the first entry, so there is nothing before it to compare with.</p>
                  )}
                  <ManuscriptView key={selected.key} content={ready.content} heightClass="max-h-[calc(100vh-200px)]" />
                </>
              )}
            </>
          )}
        </div>

        <aside className="flex min-h-0 flex-col border-t border-[#dfe8df] bg-white lg:border-l lg:border-t-0" aria-label="History">
          <div className="border-b border-[#edf2ec] px-4 py-4">
            <h3 className="text-base font-semibold text-[#203028]">Version history</h3>
          </div>

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
                          <span className="mt-0.5 block text-[11px] text-[#9aa59e]">{number(entry.words)} words</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
