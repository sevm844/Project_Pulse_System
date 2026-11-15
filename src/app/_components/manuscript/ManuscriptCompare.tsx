"use client";

import type { JSONContent } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { errorMessage } from "../../_lib/groups";
import { fetchManuscriptComments, fetchManuscriptVersion, type ManuscriptComment, type ManuscriptVersion } from "../../_lib/manuscript";
import { commentState, compareDocuments, toSections, type AddressedState, type Block, type DiffRow, type Part } from "../../_lib/manuscriptDiff";
import { formatDateTime } from "../../_lib/requirements";

type Loaded = { from: number; to: number; fromDoc?: JSONContent; toDoc?: JSONContent; error?: string };

const number = (n: number) => n.toLocaleString("en-PH");

// Two frozen versions side by side in one reading: what was added (green), what was removed (red) and what was
// reworded (old words struck through, new words underlined), plus who saved each version and when.
export default function ManuscriptCompare({
  projectId,
  versions,
  initialTo,
  onClose,
}: {
  projectId: number;
  versions: ManuscriptVersion[];
  initialTo?: number;
  onClose: () => void;
}) {
  const ordered = useMemo(() => [...versions].sort((a, b) => a.version_no - b.version_no), [versions]);
  const latest = ordered[ordered.length - 1].version_no;
  const startTo = initialTo && ordered.some((v) => v.version_no === initialTo) ? initialTo : latest;
  const startFrom = [...ordered].reverse().find((v) => v.version_no < startTo)?.version_no ?? ordered[0].version_no;

  const [fromNo, setFromNo] = useState(startFrom);
  const [toNo, setToNo] = useState(startTo);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [onlyChanges, setOnlyChanges] = useState(true);
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const [current, setCurrent] = useState(-1);
  const [fromComments, setFromComments] = useState<{ no: number; list: ManuscriptComment[] } | null>(null);
  const cache = useRef(new Map<number, JSONContent>());
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function open(no: number) {
      const hit = cache.current.get(no);
      if (hit) return hit;
      const version = await fetchManuscriptVersion(projectId, no);
      cache.current.set(no, version.content);

      return version.content;
    }

    Promise.all([open(fromNo), open(toNo)])
      .then(([fromDoc, toDoc]) => !cancelled && setLoaded({ from: fromNo, to: toNo, fromDoc, toDoc }))
      .catch((err) => !cancelled && setLoaded({ from: fromNo, to: toNo, error: errorMessage(err, "Unable to open these versions.") }));

    return () => {
      cancelled = true;
    };
  }, [projectId, fromNo, toNo]);

  // What the reviewers asked for on the older version, so the comparison can show whether it was done.
  useEffect(() => {
    let cancelled = false;
    fetchManuscriptComments(projectId, fromNo)
      .then((list) => !cancelled && setFromComments({ no: fromNo, list }))
      .catch(() => !cancelled && setFromComments({ no: fromNo, list: [] }));

    return () => {
      cancelled = true;
    };
  }, [projectId, fromNo]);

  const ready = loaded && loaded.from === fromNo && loaded.to === toNo ? loaded : null;
  const result = useMemo(() => (ready?.fromDoc && ready.toDoc ? compareDocuments(ready.fromDoc, ready.toDoc) : null), [ready]);
  const sections = useMemo(() => (result ? toSections(result.rows, onlyChanges, expanded) : []), [result, onlyChanges, expanded]);
  const total = result ? result.rows.filter((row) => row.type !== "same").length : 0;

  const asked = useMemo(
    () =>
      result && fromComments && fromComments.no === fromNo
        ? fromComments.list.map((comment) => ({ comment, state: commentState(result.rows, comment) }))
        : [],
    [result, fromComments, fromNo],
  );

  const fromVersion = ordered.find((v) => v.version_no === fromNo);
  const toVersion = ordered.find((v) => v.version_no === toNo);

  function choose(side: "from" | "to", no: number) {
    // The older version is always the one on the left, so picking past the other one moves it along.
    let nextFrom = side === "from" ? no : fromNo;
    let nextTo = side === "to" ? no : toNo;

    if (nextFrom >= nextTo) {
      if (side === "from") nextTo = ordered.find((v) => v.version_no > nextFrom)?.version_no ?? nextTo;
      else nextFrom = [...ordered].reverse().find((v) => v.version_no < nextTo)?.version_no ?? nextFrom;
    }
    if (nextFrom >= nextTo) return;

    setFromNo(nextFrom);
    setToNo(nextTo);
    setCurrent(-1);
    setExpanded(new Set());
  }

  function go(delta: number) {
    if (total === 0) return;
    const next = current < 0 ? (delta > 0 ? 0 : total - 1) : Math.min(total - 1, Math.max(0, current + delta));
    setCurrent(next);
    scroller.current?.querySelector(`[data-change="${next}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stats = result?.stats;

  // Drawn at the top level of the page so no layer of the portal layout (the sidebar button) can sit over it.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Compare manuscript versions" className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ec] px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-[#203028]">Compare versions</h3>
            <p className="mt-0.5 text-xs text-[#59645d]">See what changed between two submitted versions of the manuscript.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
            Close
          </button>
        </div>

        <div className="grid gap-3 border-b border-[#edf2ec] bg-[#f8faf7] px-5 py-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <VersionCard label="Older version" value={fromNo} versions={ordered} version={fromVersion} onChange={(no) => choose("from", no)} />
          <div className="hidden items-center text-[#7b877f] md:flex" aria-hidden="true">
            <span className="text-xl">→</span>
          </div>
          <VersionCard label="Newer version" value={toNo} versions={ordered} version={toVersion} onChange={(no) => choose("to", no)} />
        </div>

        {ready?.error && (
          <p role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {ready.error}
          </p>
        )}

        {!ready && <p className="px-5 py-10 text-center text-sm text-[#7b877f]">Comparing versions...</p>}

        {result && stats && (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-[#edf2ec] px-5 py-3" aria-label="Summary of changes">
              <Chip tone="amber" value={stats.changed} label={stats.changed === 1 ? "paragraph edited" : "paragraphs edited"} />
              <Chip tone="green" value={stats.added} label={stats.added === 1 ? "paragraph added" : "paragraphs added"} />
              <Chip tone="red" value={stats.removed} label={stats.removed === 1 ? "paragraph removed" : "paragraphs removed"} />
              <span className="ml-auto text-xs font-semibold text-[#59645d]">
                <span className="text-emerald-700">+{number(stats.wordsAdded)} words</span>
                <span className="mx-1.5 text-[#c4cec7]">|</span>
                <span className="text-red-700">&minus;{number(stats.wordsRemoved)} words</span>
              </span>
            </div>

            {asked.length > 0 && <AskedPanel versionNo={fromNo} asked={asked} />}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#edf2ec] px-5 py-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#203028]">
                <input type="checkbox" checked={onlyChanges} onChange={(event) => setOnlyChanges(event.target.checked)} className="h-4 w-4 accent-[#123f2b]" />
                Show only changes
              </label>

              <p className="flex items-center gap-3 text-[11px] text-[#59645d]" aria-label="Legend">
                <span><mark className="rounded bg-emerald-100 px-1 text-emerald-900 underline decoration-emerald-500">Added</mark></span>
                <span><mark className="rounded bg-red-100 px-1 text-red-800 line-through">Removed</mark></span>
              </p>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-[#59645d]" aria-live="polite">
                  {total === 0 ? "No changes" : current < 0 ? `${total} ${total === 1 ? "change" : "changes"}` : `Change ${current + 1} of ${total}`}
                </span>
                <button type="button" disabled={total === 0 || current === 0} onClick={() => go(-1)} className="rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-40">
                  &lsaquo; Previous
                </button>
                <button type="button" disabled={total === 0 || current === total - 1} onClick={() => go(1)} className="rounded-full bg-[#123f2b] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40">
                  Next &rsaquo;
                </button>
              </div>
            </div>

            {result.coarse && (
              <p className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                These two versions are very different, so the old text is shown as removed and the new text as added.
              </p>
            )}

            <div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-[#eef2ee] p-3 sm:p-5">
              <article className="mx-auto max-w-3xl rounded-lg bg-white px-5 py-6 text-[14px] leading-relaxed text-[#1f2a24] shadow-sm sm:px-9">
                {total === 0 && (
                  <p className="mb-5 rounded-lg border border-[#dfe8df] bg-[#f8faf7] p-4 text-sm text-[#59645d]">
                    The words are the same in these two versions. Only formatting (fonts, sizes or spacing) may differ.
                  </p>
                )}

                {sections.map((section) => {
                  if (section.kind === "change") {
                    return <ChangeRow key={`c${section.index}`} row={section.row} index={section.index} active={section.index === current} />;
                  }
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
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

const STATE_LABEL: Record<AddressedState, { text: string; cls: string }> = {
  changed: { text: "Words changed", cls: "text-emerald-800" },
  removed: { text: "Paragraph removed", cls: "text-emerald-800" },
  unchanged: { text: "Not changed", cls: "text-amber-800" },
};

// The comments the reviewers left on the older version, each with what happened to the words it pointed at.
function AskedPanel({ versionNo, asked }: { versionNo: number; asked: { comment: ManuscriptComment; state: AddressedState | null }[] }) {
  const done = asked.filter((a) => a.state === "changed" || a.state === "removed").length;
  const untouched = asked.filter((a) => a.state === "unchanged").length;

  return (
    <details className="group border-b border-[#edf2ec] bg-[#fcfdfb] px-5 py-2.5">
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#203028]">
        <span>Comments on Version {versionNo}: {asked.length}</span>
        {done > 0 && <span className="text-emerald-800">{done} acted on</span>}
        {untouched > 0 && <span className="text-amber-800">{untouched} not changed</span>}
        <span className="ml-auto font-normal text-[#7b877f] group-open:hidden">Show</span>
        <span className="ml-auto hidden font-normal text-[#7b877f] group-open:inline">Hide</span>
      </summary>
      <ul className="mt-2 max-h-48 space-y-2 overflow-auto">
        {asked.map(({ comment, state }) => (
          <li key={comment.comment_id} className="rounded-lg border border-[#e5ebe5] bg-white px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {state && <span className={`text-[10px] font-bold uppercase tracking-wide ${STATE_LABEL[state].cls}`}>{STATE_LABEL[state].text}</span>}
              <span className={`text-[10px] font-bold uppercase tracking-wide ${comment.status ==="Resolved"? " text-emerald-700" : " text-amber-700"}`}>{comment.status}</span>
              <span className="text-[#7b877f]">{comment.author}</span>
            </div>
            {comment.quote && <p className="mt-1 border-l-2 border-amber-400 pl-2 italic text-[#59645d]">&ldquo;{comment.quote.length > 120 ? `${comment.quote.slice(0, 120)}…` : comment.quote}&rdquo;</p>}
            <p className="mt-1 break-words text-[#203028]">{comment.body}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function VersionCard({
  label,
  value,
  versions,
  version,
  onChange,
}: {
  label: string;
  value: number;
  versions: ManuscriptVersion[];
  version?: ManuscriptVersion;
  onChange: (no: number) => void;
}) {
  const others = version ? version.editors.filter((name) => name !== version.saved_by) : [];

  return (
    <div className="rounded-xl border border-[#dfe8df] bg-white p-3">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]">
        {label}
        <select
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-2.5 py-1.5 text-sm font-semibold normal-case tracking-normal text-[#203028]"
        >
          {versions.map((v) => (
            <option key={v.version_no} value={v.version_no}>
              Version {v.version_no} &middot; {formatDateTime(v.saved_at)}
            </option>
          ))}
        </select>
      </label>
      {version && (
        <div className="mt-2 text-xs text-[#59645d]">
          <p>
            Saved by <span className="font-semibold text-[#203028]">{version.saved_by ?? "Unknown"}</span> &middot; {number(version.word_count)} words
          </p>
          {others.length > 0 && <p className="mt-0.5 text-[11px] text-[#7b877f]">Also edited by {others.join(", ")}</p>}
          {version.note && <p className="mt-1 break-words italic">&ldquo;{version.note}&rdquo;</p>}
        </div>
      )}
    </div>
  );
}

function Chip({ tone, value, label }: { tone: "green" | "red" | "amber"; value: number; label: string }) {
  const style = {
    green: "text-emerald-800",
    red: "text-red-800",
    amber: "text-amber-800",
  }[tone];

  return (
    <span className={`text-xs font-semibold ${style}`}>
      {number(value)} {label}
    </span>
  );
}

const TAG = {
  added: { text: "Added", cls: "text-emerald-700", bar: "border-emerald-500 bg-emerald-50/70" },
  removed: { text: "Removed", cls: "text-red-700", bar: "border-red-400 bg-red-50/70" },
  changed: { text: "Edited", cls: "text-amber-700", bar: "border-amber-400 bg-amber-50/50" },
} as const;

function ChangeRow({ row, index, active }: { row: DiffRow; index: number; active: boolean }) {
  if (row.type === "same") return null;
  const tag = TAG[row.type];

  return (
    <div data-change={index} className={`my-3 rounded-r-lg border-l-4 py-2 pl-3 pr-3 ${tag.bar} ${active ? "ring-2 ring-[#123f2b]/40" : ""}`}>
      <p className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${tag.cls}`}>{tag.text}</p>
      {row.type === "added" && <BlockView block={row.block} mark="add" />}
      {row.type === "removed" && <BlockView block={row.block} mark="del" />}
      {row.type === "changed" && <BlockView block={row.after} parts={row.parts} />}
    </div>
  );
}

const MARK = {
  add: "rounded-sm bg-emerald-100 text-emerald-900 underline decoration-emerald-500 decoration-1 underline-offset-2",
  del: "mr-0.5 rounded-sm bg-red-100 text-red-800 line-through decoration-red-500",
} as const;

// One paragraph, heading, list item, table row or picture, written the way it reads. `mark` colours all of it
// (a whole added or removed paragraph); `parts` colours only the reworded pieces inside it.
function BlockView({ block, mark, parts }: { block: Block; mark?: "add" | "del"; parts?: Part[] }) {
  const body = parts ? (
    parts.map((part, i) => (part.t === "same" ? <span key={i}>{part.text}</span> : <mark key={i} className={MARK[part.t]}>{part.text}</mark>))
  ) : mark ? (
    <mark className={MARK[mark]}>{block.text}</mark>
  ) : (
    block.text
  );

  return <BlockShell block={block}>{body}</BlockShell>;
}

// The frame of one block (heading, list item, table row, picture...) around whatever words it holds. With an `index`
// the words sit in a marked element, so a reader's selection can be turned back into "paragraph n, characters a to b".
export function BlockShell({ block, index, children }: { block: Block; index?: number; children: React.ReactNode }) {
  const body = index === undefined ? children : <span data-text="true" data-block={index}>{children}</span>;

  switch (block.kind) {
    case "heading":
      return (
        <p className={block.level === 1 ? "my-3 text-center text-[15px] font-bold uppercase tracking-wide" : block.level === 2 ? "my-2 text-[15px] font-bold" : "my-2 text-[14px] font-bold italic"}>
          {body}
        </p>
      );
    case "item":
      return (
        <p className="my-1 flex gap-2" style={{ paddingLeft: `${(block.depth ?? 0) * 20 + 8}px` }}>
          <span className="w-5 shrink-0 text-right text-[#7b877f]">{block.marker}</span>
          <span className="min-w-0">{body}</span>
        </p>
      );
    case "quote":
      return <p className="my-2 border-l-2 border-[#cfd9d1] pl-3 italic text-[#59645d]">{body}</p>;
    case "code":
      return <p className="my-2 whitespace-pre-wrap rounded bg-[#f3f5f3] px-2 py-1 font-mono text-[12px]">{body}</p>;
    case "row":
      return (
        <p className="my-1 rounded border border-[#e5ebe5] bg-[#fafbfa] px-2 py-1 text-[13px]">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-[#7b877f]">Table row</span>
          {body}
        </p>
      );
    case "image":
      return (
        <p className="my-2 inline-block rounded border border-dashed border-[#cfd9d1] bg-[#fafbfa] px-2 py-1 text-[13px] text-[#59645d]">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-[#7b877f]">Picture</span>
          {body}
        </p>
      );
    default:
      return <p className="my-2 break-words">{body}</p>;
  }
}
