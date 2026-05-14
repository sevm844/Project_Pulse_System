"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

type HighlightCommentEditorProps = {
  content: string;
  fontSize: string;
  onInput?: () => void;
  onFocus?: () => void;
  onKeyDown?: () => void;
};

type SavedComment = {
  id: string;
  text: string;
  comment: string;
};

const HighlightCommentEditor = forwardRef<
  HTMLDivElement,
  HighlightCommentEditorProps
>(function HighlightCommentEditor(
  { content, fontSize, onInput, onFocus, onKeyDown },
  forwardedRef,
) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [toolbar, setToolbar] = useState<{
    x: number;
    y: number;
    selectedText: string;
  } | null>(null);

  const [commentBox, setCommentBox] = useState<{
    selectedText: string;
  } | null>(null);

  const [commentText, setCommentText] = useState("");
  const [activeComment, setActiveComment] = useState<SavedComment | null>(null);

  function setRefs(node: HTMLDivElement | null) {
    editorRef.current = node;

    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }

  useEffect(() => {
    if (!editorRef.current) return;

    if (!editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = content;
    }

    forceEditorDirection();
  }, [content]);

  function forceEditorDirection() {
    if (!editorRef.current) return;

    editorRef.current.setAttribute("dir", "ltr");
    editorRef.current.style.direction = "ltr";
    editorRef.current.style.unicodeBidi = "normal";
    editorRef.current.style.writingMode = "horizontal-tb";
    editorRef.current.style.transform = "none";
  }

  function getHighlightFromTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return null;

    return target.closest("mark[data-comment-id]") as HTMLElement | null;
  }

  function showSavedComment(highlight: HTMLElement) {
    setToolbar(null);
    setCommentBox(null);

    setActiveComment({
      id: highlight.dataset.commentId || "",
      text: highlight.dataset.selectedText || highlight.textContent || "",
      comment: highlight.dataset.comment || "",
    });
  }

  function handleEditorMouseDown(event: MouseEvent<HTMLDivElement>) {
    const highlight = getHighlightFromTarget(event.target);

    if (!highlight) return;

    event.preventDefault();
    event.stopPropagation();

    showSavedComment(highlight);
  }

  function handleEditorClick(event: MouseEvent<HTMLDivElement>) {
    const highlight = getHighlightFromTarget(event.target);

    if (!highlight) return;

    event.preventDefault();
    event.stopPropagation();

    showSavedComment(highlight);
  }

  function handleMouseUp(event: MouseEvent<HTMLDivElement>) {
    const highlight = getHighlightFromTarget(event.target);

    if (highlight) {
      showSavedComment(highlight);
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setToolbar(null);
        return;
      }

      const selectedText = selection.toString().trim();

      if (!selectedText) {
        setToolbar(null);
        return;
      }

      const range = selection.getRangeAt(0);

      if (!editorRef.current?.contains(range.commonAncestorContainer)) {
        setToolbar(null);
        return;
      }

      const rect = range.getBoundingClientRect();

      savedRangeRef.current = range.cloneRange();

      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top - 52,
        selectedText,
      });
    }, 0);
  }

  function openCommentBox(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!toolbar || !savedRangeRef.current) return;

    setCommentBox({
      selectedText: toolbar.selectedText,
    });

    setActiveComment(null);
    setToolbar(null);
  }

  function saveComment() {
    if (!commentBox || !commentText.trim() || !savedRangeRef.current) return;

    const range = savedRangeRef.current;
    const id = `comment-${Date.now()}`;
    const selectedText = commentBox.selectedText;
    const comment = commentText.trim();

    const mark = document.createElement("mark");
    mark.dataset.commentId = id;
    mark.dataset.comment = comment;
    mark.dataset.selectedText = selectedText;
    mark.className = "document-comment-highlight";
    mark.title = "Click to view comment";

    try {
      const selectedContent = range.extractContents();
      mark.appendChild(selectedContent);
      range.insertNode(mark);
    } catch {
      mark.textContent = selectedText;
      range.deleteContents();
      range.insertNode(mark);
    }

    setActiveComment({
      id,
      text: selectedText,
      comment,
    });

    setCommentText("");
    setCommentBox(null);
    savedRangeRef.current = null;

    window.getSelection()?.removeAllRanges();
    forceEditorDirection();
    onInput?.();
  }

  return (
    <div className="relative flex w-full justify-center">
      <style jsx global>{`
        .document-create-editor {
          caret-color: #203028;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          direction: ltr !important;
          unicode-bidi: normal !important;
          writing-mode: horizontal-tb !important;
          transform: none !important;
          text-align: left;
        }

        .document-create-editor * {
          direction: ltr !important;
          unicode-bidi: normal !important;
          writing-mode: horizontal-tb !important;
          transform: none !important;
        }

        .document-create-editor ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          margin: 0.75rem 0 0.75rem 2rem !important;
          padding-left: 1.25rem !important;
        }

        .document-create-editor ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          margin: 0.75rem 0 0.75rem 2rem !important;
          padding-left: 1.25rem !important;
        }

        .document-create-editor li {
          display: list-item !important;
          margin: 0.35rem 0 !important;
          padding-left: 0.25rem !important;
        }

        .document-comment-highlight {
          background: #fef08a !important;
          border-radius: 3px;
          cursor: pointer;
          padding: 0 2px;
        }

        .document-comment-highlight:hover {
          background: #fde047 !important;
        }
      `}</style>

      <div
        ref={setRefs}
        contentEditable
        suppressContentEditableWarning
        dir="ltr"
        spellCheck
        onMouseDown={handleEditorMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleEditorClick}
        onInput={() => {
          forceEditorDirection();
          onInput?.();
        }}
        onFocus={() => {
          forceEditorDirection();
          onFocus?.();
        }}
        onKeyDown={() => {
          forceEditorDirection();
          onKeyDown?.();
        }}
        className="document-create-editor min-h-[920px] w-full max-w-[850px] bg-white px-16 py-14 text-[#203028] shadow-[0_10px_35px_rgba(31,42,36,0.12)] outline-none"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: "1.7",
        }}
      />

      {toolbar && (
        <div
          className="fixed z-50 flex items-center rounded-full border border-[#dfe8df] bg-white p-2 shadow-xl"
          style={{
            left: toolbar.x,
            top: toolbar.y,
            transform: "translateX(-50%)",
          }}
        >
          <button
            type="button"
            title="Add comment"
            aria-label="Add comment"
            onMouseDown={openCommentBox}
            className="flex h-10 w-10 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 4H19C20.1 4 21 4.9 21 6V16C21 17.1 20.1 18 19 18H9L5 21V18H5C3.9 18 3 17.1 3 16V6C3 4.9 3.9 4 5 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 8V14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 11H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {commentBox && (
        <aside className="fixed right-8 top-28 z-50 w-80 rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-2xl">
          <button
            type="button"
            aria-label="Close comment box"
            onClick={() => {
              setCommentBox(null);
              setCommentText("");
            }}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#59645d] hover:bg-[#f3f7f1]"
          >
            ×
          </button>

          <p className="pr-10 text-xs font-semibold uppercase tracking-wide text-[#7b877f]">
            Add comment
          </p>

          <p className="mt-3 rounded-lg bg-yellow-100 p-3 text-sm text-[#203028]">
            {commentBox.selectedText}
          </p>

          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            autoFocus
            placeholder="Write a comment..."
            className="mt-4 min-h-28 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCommentBox(null);
                setCommentText("");
              }}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveComment}
              disabled={!commentText.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Comment
            </button>
          </div>
        </aside>
      )}

      {activeComment && (
        <aside className="fixed right-8 top-28 z-50 w-80 rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-2xl">
          <button
            type="button"
            aria-label="Close comment"
            onClick={() => setActiveComment(null)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#59645d] hover:bg-[#f3f7f1]"
          >
            ×
          </button>

          <p className="pr-10 text-xs font-semibold uppercase tracking-wide text-[#7b877f]">
            Comment
          </p>

          <p className="mt-3 rounded-lg bg-yellow-100 p-3 text-sm text-[#203028]">
            {activeComment.text}
          </p>

          <p className="mt-4 text-sm leading-6 text-[#59645d]">
            {activeComment.comment}
          </p>
        </aside>
      )}
    </div>
  );
});

export default HighlightCommentEditor;