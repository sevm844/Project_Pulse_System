"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { errorMessage } from "../../_lib/groups";
import {
  addManuscriptComment,
  fetchManuscriptComments,
  fetchManuscriptVersion,
  replyToManuscriptComment,
  setManuscriptCommentStatus,
  type CommentAnchor,
  type ManuscriptComment,
  type ManuscriptVersion,
} from "../../_lib/manuscript";
import { toBlocks, type Block } from "../../_lib/manuscriptDiff";
import { formatDateTime } from "../../_lib/requirements";
import { BlockShell } from "./ManuscriptCompare";

type Pick = { block: number; start: number; end: number; quote: string; x: number; y: number };
type Filter = "All" | "Open" | "Resolved";

// Where the words of a comment sit now. The saved range is used when it still holds the quoted words; otherwise the
// quote is searched for in the paragraph; a comment whose words cannot be found is listed without a highlight.
function resolveRange(block: Block | undefined, comment: ManuscriptComment): [number, number] | null {
  if (!block || comment.block_index === null || comment.start_offset === null || comment.end_offset === null || !comment.quote) return null;
  const quote = comment.quote.trim();
  if (block.text.slice(comment.start_offset, comment.end_offset).trim() === quote) return [comment.start_offset, comment.end_offset];
  const at = block.text.indexOf(quote);

  return at >= 0 ? [at, at + quote.length] : null;
}

// Reading one submitted version with its review comments. The adviser and the Dean select words to comment and decide
// when a comment is resolved; the students read the comments and reply.
export default function ManuscriptReview({
  projectId,
  versionNo,
  version,
  canComment,
  onClose,
  onChanged,
}: {
  projectId: number;
  versionNo: number;
  version?: ManuscriptVersion;
  canComment: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [comments, setComments] = useState<ManuscriptComment[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [active, setActive] = useState<number | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  // What the composer is about: words in the paper, or the whole version. null = closed.
  const [composing, setComposing] = useState<CommentAnchor | "whole" | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const paper = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchManuscriptVersion(projectId, versionNo), fetchManuscriptComments(projectId, versionNo)])
      .then(([v, list]) => {
        if (cancelled) return;
        setBlocks(toBlocks(v.content));
        setComments(list);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Unable to open this version.")));

    return () => {
      cancelled = true;
    };
  }, [projectId, versionNo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ranges = useMemo(() => {
    const byBlock = new Map<number, { id: number; from: number; to: number }[]>();
    if (!blocks) return byBlock;
    for (const c of comments) {
      const range = resolveRange(blocks[c.block_index ?? -1], c);
      if (!range || c.block_index === null) continue;
      byBlock.set(c.block_index, [...(byBlock.get(c.block_index) ?? []), { id: c.comment_id, from: range[0], to: range[1] }]);
    }

    return byBlock;
  }, [blocks, comments]);

  const status = useMemo(() => new Map(comments.map((c) => [c.comment_id, c.status])), [comments]);

  const counts = { All: comments.length, Open: comments.filter((c) => c.status === "Open").length, Resolved: comments.filter((c) => c.status === "Resolved").length };
  const shown = useMemo(
    () =>
      comments
        .filter((c) => filter === "All" || c.status === filter)
        .sort((a, b) => (a.block_index ?? -1) - (b.block_index ?? -1) || (a.start_offset ?? 0) - (b.start_offset ?? 0) || a.comment_id - b.comment_id),
    [comments, filter],
  );

  const replace = useCallback(
    (updated: ManuscriptComment) => {
      setComments((list) => list.map((c) => (c.comment_id === updated.comment_id ? updated : c)));
      onChanged?.();
    },
    [onChanged],
  );

  // Turn the words the reader selected into a place in the version: the paragraph and the characters inside it.
  function readSelection() {
    const selection = window.getSelection();
    if (!canComment || !selection || selection.rangeCount === 0 || selection.isCollapsed) return setPick(null);

    const range = selection.getRangeAt(0);
    const host = (node: Node) => (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>("[data-text]") ?? null;
    const first = host(range.startContainer);
    if (!first || !paper.current?.contains(first)) return setPick(null);

    const last = host(range.endContainer);
    const offsetIn = (el: HTMLElement, node: Node, at: number) => {
      const before = document.createRange();
      before.selectNodeContents(el);
      before.setEnd(node, at);

      return before.toString().length;
    };

    const text = first.textContent ?? "";
    let start = offsetIn(first, range.startContainer, range.startOffset);
    // A selection that runs on into the next paragraph is cut at the end of the first one.
    let end = last === first ? offsetIn(first, range.endContainer, range.endOffset) : text.length;
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (end - start < 1) return setPick(null);

    const rect = range.getBoundingClientRect();
    setPick({
      block: Number(first.dataset.block),
      start,
      end,
      quote: text.slice(start, Math.min(end, start + 600)),
      x: Math.min(rect.right, window.innerWidth - 150),
      y: rect.bottom + 8,
    });
  }

  // Mouse, finger (long-press and drag the handles) and keyboard all end up as a change of the selection, so that is what is
  // listened to. Reading it a moment later lets the selection settle while a handle is still being dragged.
  const readRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    readRef.current = readSelection;
  });
  useEffect(() => {
    let timer: number | undefined;
    const onChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => readRef.current(), 200);
    };
    document.addEventListener("selectionchange", onChange);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("selectionchange", onChange);
    };
  }, []);

  function startComment(target: CommentAnchor | "whole") {
    setComposing(target);
    setDraft("");
    setPick(null);
    window.getSelection()?.removeAllRanges();
    setFilter("All");
  }

  async function save() {
    if (composing === null || busy) return;
    setBusy(true);
    setError("");

    try {
      const created = await addManuscriptComment(projectId, versionNo, draft.trim(), composing === "whole" ? undefined : composing);
      setComments((list) => [...list, created]);
      setComposing(null);
      setDraft("");
      setActive(created.comment_id);
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err, "Unable to save the comment."));
    }

    setBusy(false);
  }

  function focusComment(id: number, from: "paper" | "panel") {
    setActive(id);
    if (from === "paper") {
      setFilter("All");
      requestAnimationFrame(() => document.getElementById(`mc-card-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    } else {
      paper.current?.querySelector(`[data-mark~="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white">
      <div role="dialog" aria-modal="true" aria-label={`${canComment ? "Review" : "Comments on"} version ${versionNo}`} className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ec] px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-[#203028]">{canComment ? "Review" : "Comments on"} version {versionNo}</h3>
            <p className="mt-0.5 text-xs text-[#59645d]">
              {version ? `Saved by ${version.saved_by ?? "Unknown"} · ${formatDateTime(version.saved_at)} · ${version.word_count.toLocaleString("en-PH")} words` : ""}
            </p>
            <p className="mt-1 text-xs text-[#7b877f]">
              {canComment ? "Select any words in the paper to leave a comment on them." : "Your adviser's and the Dean's comments appear here. Reply to tell them what you changed."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
            Close
          </button>
        </div>

        {error && (
          <p role="alert" className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        {!blocks && !error && <p className="px-5 py-10 text-center text-sm text-[#7b877f]">Opening version...</p>}

        {blocks && (
          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden">
            <div ref={paper} className="max-h-[60vh] min-h-[40vh] overflow-auto bg-[#e6ebe6] p-3 sm:p-5 lg:max-h-none">
              {blocks.length === 0 && <p className="text-sm text-[#7b877f]">This version has no text.</p>}
              <PagedPaper
                blocks={blocks}
                renderBlock={(block, index) => (
                  <BlockShell block={block} index={index}>
                    <Highlighted text={block.text} ranges={ranges.get(index) ?? []} active={active} status={status} onPick={(id) => focusComment(id, "paper")} />
                  </BlockShell>
                )}
              />
            </div>

            <aside ref={panel} className="flex min-h-0 flex-col border-t border-[#edf2ec] bg-[#f8faf7] lg:border-l lg:border-t-0" aria-label="Comments">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-[#edf2ec] px-4 py-3">
                {(["All", "Open", "Resolved"] as Filter[]).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFilter(name)}
                    aria-pressed={filter === name}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === name ? "border-[#123f2b] bg-[#123f2b] text-white" : "border-[#dfe8df] bg-white text-[#203028] hover:bg-[#f3f7f1]"}`}
                  >
                    {name} ({counts[name]})
                  </button>
                ))}
                {canComment && (
                  <button type="button" onClick={() => startComment("whole")} className="ml-auto rounded-full border border-[#cfe0d3] bg-white px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4]">
                    + Whole version
                  </button>
                )}
              </div>

              <div className="space-y-3 p-4 lg:min-h-0 lg:flex-1 lg:overflow-auto">
                {composing !== null && (
                  <div className="rounded-xl border border-[#123f2b]/40 bg-white p-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]">New comment</p>
                    {composing === "whole" ? (
                      <p className="mt-1 text-xs text-[#59645d]">About the whole version</p>
                    ) : (
                      <p className="mt-1 border-l-2 border-amber-400 pl-2 text-xs italic text-[#59645d]">&ldquo;{composing.quote}&rdquo;</p>
                    )}
                    <textarea
                      autoFocus
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      maxLength={2000}
                      rows={3}
                      aria-label="Your comment"
                      placeholder="What should the students change or improve?"
                      className="mt-2 w-full rounded-lg border border-[#dfe8df] px-2.5 py-2 text-sm"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setComposing(null)} className="rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1]">
                        Cancel
                      </button>
                      <button type="button" disabled={busy || draft.trim().length < 2} onClick={() => void save()} className="rounded-full bg-[#123f2b] px-4 py-1 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
                        {busy ? "Saving..." : "Add comment"}
                      </button>
                    </div>
                  </div>
                )}

                {shown.length === 0 && composing === null && (
                  <p className="rounded-xl border border-dashed border-[#cfd9d1] bg-white p-4 text-center text-xs text-[#7b877f]">
                    {comments.length === 0 ? (canComment ? "No comments yet. Select words in the paper to add the first one." : "No comments on this version yet.") : `No ${filter.toLowerCase()} comments.`}
                  </p>
                )}

                {shown.map((comment) => (
                  <CommentCard
                    key={comment.comment_id}
                    comment={comment}
                    canResolve={comment.can_resolve}
                    active={active === comment.comment_id}
                    located={comment.block_index === null || resolveRange(blocks[comment.block_index], comment) !== null}
                    onActivate={() => focusComment(comment.comment_id, "panel")}
                    onChange={replace}
                  />
                ))}
              </div>
            </aside>
          </div>
        )}

        {pick && canComment && (
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              startComment({ block_index: pick.block, start_offset: pick.start, end_offset: pick.end, quote: pick.quote });
            }}
            onClick={() => startComment({ block_index: pick.block, start_offset: pick.start, end_offset: pick.end, quote: pick.quote })}
            style={{ position: "fixed", left: Math.max(8, pick.x - 60), top: pick.y }}
            className="z-[110] rounded-full bg-[#123f2b] px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-[#0f3324]"
          >
            + Comment
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

// A paragraph's words with the commented stretches marked: amber while the comment is open, soft green once resolved.
// Letter size at 96 dpi, 1 inch margins: the same page the manuscript editor and the exports use.
const PAGE_W = 816;
const PAGE_H = 1056;
const MARGIN = 72;

// The paper shown page by page, each page its own sheet with the page number above it. The blocks are measured once at the real text width
// (an invisible copy), then handed out to pages greedily; a paragraph is never cut, so a very long one makes its page taller.
function PagedPaper({ blocks, renderBlock }: { blocks: Block[]; renderBlock: (block: Block, index: number) => React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [layout, setLayout] = useState<{ key: string; pages: [number, number][] } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);

    return () => observer.disconnect();
  }, []);

  // While the paper scrolls, a small bubble beside the scrollbar says which page is on screen ("7 of 70"), like the editor.
  const [bubble, setBubble] = useState<{ page: number; top: number; left: number; show: boolean } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scroller = box.current?.parentElement;
    if (!scroller) return;

    const onScroll = () => {
      const rect = scroller.getBoundingClientRect();
      const room = scroller.scrollHeight - scroller.clientHeight;
      const fraction = room > 0 ? scroller.scrollTop / room : 0;
      const sheets = Array.from(box.current?.querySelectorAll<HTMLElement>("[data-page]") ?? []);
      let page = 1;
      sheets.forEach((sheet, i) => {
        // The last page whose top has passed the middle of the visible area.
        if (sheet.getBoundingClientRect().top - rect.top <= scroller.clientHeight / 2) page = i + 1;
      });

      setBubble({ page, top: rect.top + fraction * Math.max(0, scroller.clientHeight - 34), left: rect.right - 90, show: true });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setBubble((current) => (current ? { ...current, show: false } : current)), 1400);
    };

    scroller.addEventListener("scroll", onScroll);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const pageW = Math.max(280, Math.min(PAGE_W, width));
  const k = pageW / PAGE_W;
  const padX = MARGIN * k;
  const contentW = pageW - 2 * padX;
  const contentH = (PAGE_H - 2 * MARGIN) * k;
  const key = `${blocks.length}:${Math.round(contentW)}`;
  const ready = layout?.key === key;

  useLayoutEffect(() => {
    const root = measure.current;
    if (ready || !root || width === 0) return;

    const tops = Array.from(root.children).map((el) => (el as HTMLElement).offsetTop);
    const total = root.scrollHeight;
    const pages: [number, number][] = [];
    let start = 0;
    let y0 = tops[0] ?? 0;

    for (let i = 0; i < tops.length; i++) {
      const bottom = i + 1 < tops.length ? tops[i + 1] : total;
      if (i > start && bottom - y0 > contentH) {
        pages.push([start, i]);
        start = i;
        y0 = tops[i];
      }
    }
    if (tops.length > 0) pages.push([start, tops.length]);
    setLayout({ key, pages });
  }, [ready, key, width, contentH, blocks]);

  return (
    <div ref={box} className="relative">
      {width > 0 && !ready && (
        <>
          <p className="py-10 text-center text-sm text-[#7b877f]">Laying out the pages...</p>
          <div ref={measure} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 -z-10 text-[14px] leading-relaxed" style={{ width: contentW }}>
            {blocks.map((block, index) => (
              <div key={index}>
                <BlockShell block={block}>{block.text}</BlockShell>
              </div>
            ))}
          </div>
        </>
      )}

      {ready &&
        layout.pages.map(([from, to], page) => (
          <div key={page} data-page className="mb-6 last:mb-0">
            <div className="mx-auto bg-white shadow-[0_2px_10px_rgba(31,42,36,0.18)]" style={{ width: pageW, minHeight: (pageW * PAGE_H) / PAGE_W, padding: `${MARGIN * k}px ${padX}px` }}>
              <div className="flow-root text-[14px] leading-relaxed text-[#1f2a24]">
                {blocks.slice(from, to).map((block, offset) => (
                  <div key={from + offset}>{renderBlock(block, from + offset)}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      {bubble && ready && layout.pages.length > 1 && (
        <div
          aria-hidden
          style={{ position: "fixed", top: bubble.top, left: bubble.left }}
          className={`pointer-events-none z-[105] rounded-lg bg-[#202124] px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-opacity duration-200 ${bubble.show ? "opacity-100" : "opacity-0"}`}
        >
          {bubble.page} of {layout.pages.length}
        </div>
      )}
    </div>
  );
}

function Highlighted({
  text,
  ranges,
  active,
  status,
  onPick,
}: {
  text: string;
  ranges: { id: number; from: number; to: number }[];
  active: number | null;
  status: Map<number, "Open" | "Resolved">;
  onPick: (id: number) => void;
}) {
  if (ranges.length === 0) return <>{text}</>;

  const points = [...new Set([0, text.length, ...ranges.flatMap((r) => [r.from, r.to])])].filter((p) => p >= 0 && p <= text.length).sort((a, b) => a - b);
  const pieces: React.ReactNode[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const [from, to] = [points[i], points[i + 1]];
    const ids = ranges.filter((r) => r.from <= from && r.to >= to).map((r) => r.id);
    const piece = text.slice(from, to);

    if (ids.length === 0) {
      pieces.push(<span key={from}>{piece}</span>);
      continue;
    }

    const open = ids.filter((id) => status.get(id) === "Open");
    const lead = ids.includes(active ?? -1) ? (active as number) : (open[0] ?? ids[0]);
    const style = ids.includes(active ?? -1)
      ? "bg-amber-300 ring-1 ring-amber-500"
      : open.length > 0
        ? "bg-amber-100 border-b-2 border-amber-400"
        : "bg-emerald-50 border-b border-emerald-300";

    pieces.push(
      <mark key={from} data-mark={ids.join(" ")} onClick={() => onPick(lead)} className={`cursor-pointer rounded-sm text-inherit ${style}`}>
        {piece}
      </mark>,
    );
  }

  return <>{pieces}</>;
}

function CommentCard({
  comment,
  canResolve,
  active,
  located,
  onActivate,
  onChange,
}: {
  comment: ManuscriptComment;
  canResolve: boolean;
  active: boolean;
  located: boolean;
  onActivate: () => void;
  onChange: (comment: ManuscriptComment) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resolved = comment.status === "Resolved";

  async function run(action: () => Promise<ManuscriptComment>, after?: () => void) {
    setBusy(true);
    setError("");

    try {
      onChange(await action());
      after?.();
    } catch (err) {
      setError(errorMessage(err, "Unable to save."));
    }

    setBusy(false);
  }

  return (
    <div id={`mc-card-${comment.comment_id}`} className={`rounded-xl border bg-white p-3 ${active ? "border-[#123f2b] ring-2 ring-[#123f2b]/20" : "border-[#e5ebe5]"}`}>
      <button type="button" onClick={onActivate} className="block w-full text-left">
        {comment.quote ? (
          <p className="border-l-2 border-amber-400 pl-2 text-xs italic text-[#59645d]">
            &ldquo;{comment.quote.length > 140 ? `${comment.quote.slice(0, 140)}…` : comment.quote}&rdquo;
            {!located && <span className="ml-1 not-italic text-[#7b877f]">(words not found in the paper)</span>}
          </p>
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b877f]">Whole version</p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-xs text-[#59645d]">
            <span className="font-semibold text-[#203028]">{comment.author}</span>
            {comment.author_role && <span className="ml-1 text-[11px] font-normal text-[#7b877f]">· {comment.author_role}</span>}
          </p>
          <span className={`text-[10px] font-bold uppercase tracking-wide ${resolved ?"text-emerald-700" : " text-amber-700"}`}>{comment.status}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-[#7b877f]">{formatDateTime(comment.created_at)}</p>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-[#203028]">{comment.body}</p>
      </button>

      {comment.replies.length > 0 && (
        <ul className="mt-2 space-y-2 border-t border-[#edf2ec] pt-2">
          {comment.replies.map((reply) => (
            <li key={reply.reply_id} className="text-xs">
              <p className="text-[#59645d]">
                <span className="font-semibold text-[#203028]">{reply.author}</span>
                {reply.author_role && <span className="ml-1 text-[10px] text-[#7b877f]">{reply.author_role}</span>}
                <span className="ml-1 text-[10px] text-[#7b877f]">· {formatDateTime(reply.created_at)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-[#203028]">{reply.body}</p>
            </li>
          ))}
        </ul>
      )}

      {resolved && comment.resolved_by && (
        <p className="mt-2 text-[11px] text-emerald-700">
          Resolved by {comment.resolved_by} · {formatDateTime(comment.resolved_at)}
        </p>
      )}

      {error && <p role="alert" className="mt-2 text-[11px] text-red-600">{error}</p>}

      {replying ? (
        <div className="mt-2">
          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={2000}
            rows={2}
            aria-label="Your reply"
            placeholder="Write a reply"
            className="w-full rounded-lg border border-[#dfe8df] px-2.5 py-2 text-sm"
          />
          <div className="mt-1.5 flex justify-end gap-2">
            <button type="button" onClick={() => setReplying(false)} className="rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1]">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || text.trim().length < 1}
              onClick={() => void run(() => replyToManuscriptComment(comment.comment_id, text.trim()), () => { setText(""); setReplying(false); })}
              className="rounded-full bg-[#123f2b] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
            >
              {busy ? "Sending..." : "Reply"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => setReplying(true)} className="rounded-full border border-[#dfe8df] px-3 py-1 text-xs font-semibold hover:bg-[#f3f7f1]">
            Reply
          </button>
          {canResolve && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => setManuscriptCommentStatus(comment.comment_id, resolved ? "Open" : "Resolved"))}
              className={`rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-50 ${resolved ? "border-[#dfe8df] hover:bg-[#f3f7f1]" : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
            >
              {resolved ? "Reopen" : "Mark resolved"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
