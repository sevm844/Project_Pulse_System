"use client";

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import type { ReactNode } from "react";
import { proposalBodyClass, proposalExtensions } from "./proposalConfig";

function Btn({ title, active, disabled, onClick, children }: { title: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection: clicking a button must not move the cursor out of the page.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-md px-2 text-xs transition disabled:opacity-30 ${
        active ? "bg-[#d7f7d8] text-[#123f2b]" : "text-[#203028] hover:bg-[#eef3ee]"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-[#dfe8df]" aria-hidden />;

function Toolbar({ editor }: { editor: Editor }) {
  // The buttons light up for whatever the cursor is in.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      bullets: e.isActive("bulletList"),
      numbers: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  return (
    <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-0.5 border-b border-[#dfe8df] bg-[#fbfdfb] px-2 py-1.5">
      <Btn title="Undo" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </Btn>
      <Btn title="Redo" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </Btn>
      <Sep />
      <Btn title="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn title="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Btn>
      <Btn title="Underline" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Btn>
      <Sep />
      <Btn title="Bulleted list" active={state.bullets} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </Btn>
      <Btn title="Numbered list" active={state.numbers} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </Btn>
    </div>
  );
}

// An ordinary text editor for a title proposal, like a page in Google Docs: the student writes everything in it (the title
// is typed above). What is written is reported as the editor's own JSON, or null while the page is empty.
export default function ProposalEditor({ onChange, hint }: { onChange: (content: JSONContent | null) => void; hint?: string }) {
  const editor = useEditor({
    extensions: proposalExtensions,
    content: "",
    immediatelyRender: false,
    editorProps: { attributes: { class: `${proposalBodyClass} min-h-[320px] px-6 py-5`, "aria-label": "Proposal", role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? null : e.getJSON()),
  });

  const empty = useEditorState({ editor, selector: ({ editor: e }) => e?.isEmpty ?? true });

  return (
    <div className="overflow-hidden rounded-lg border border-[#dfe8df] bg-white focus-within:ring-2 focus-within:ring-[#d7f7d8]">
      {editor && <Toolbar editor={editor} />}
      <div className="relative max-h-[70vh] min-h-[320px] resize-y overflow-auto">
        {editor && empty && hint && <p className="pointer-events-none absolute left-6 top-5 right-6 text-sm leading-7 text-[#9aa59e]">{hint}</p>}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
