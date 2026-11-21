"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import PagedScroll from "./PagedScroll";
import { createManuscriptExtensions } from "./extensions";

// A frozen version, shown exactly as typed and divided into pages. It is rendered by the editor itself (read-only)
// from the saved JSON, never as raw HTML.
export default function ManuscriptView({ content }: { content: JSONContent | string }) {
  const [pages, setPages] = useState(1);
  const extensions = useMemo(() => createManuscriptExtensions(setPages), []);

  const editor = useEditor({
    extensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "manuscript-sheet", "aria-label": "Manuscript version" } },
  });

  useEffect(() => {
    if (editor) editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, content]);

  return (
    <div>
      <PagedScroll pages={pages} padding={16} className="max-h-[62vh] bg-[#eef2ee] p-4">
        <EditorContent editor={editor} />
      </PagedScroll>
      <p className="border-t border-[#dfe8df] bg-white py-2 text-center text-xs text-[#7b877f]">
        {pages} {pages === 1 ? "page" : "pages"}
      </p>
    </div>
  );
}
