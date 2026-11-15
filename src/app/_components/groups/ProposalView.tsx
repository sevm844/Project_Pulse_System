"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import type { ApiTitleSubmission } from "../../_lib/groups";
import { proposalBodyClass, proposalExtensions } from "./proposalConfig";

export function ProposalDocument({ content }: { content: JSONContent }) {
  // Read-only: the saved JSON is drawn by the editor itself, never as raw HTML.
  const editor = useEditor({
    extensions: proposalExtensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: proposalBodyClass, "aria-label": "Proposal", role: "document" } },
  });

  useEffect(() => {
    if (editor) editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, content]);

  return <EditorContent editor={editor} />;
}

// A written proposal, as the student typed it. Proposals sent before the editor existed only have plain text.
export default function ProposalView({ item }: { item: Pick<ApiTitleSubmission, "proposal_content" | "project_description" | "technology_stack"> }) {
  if (item.proposal_content) {
    return (
      <div className="mt-2 rounded-lg border border-[#edf2ec] bg-white px-4 py-2">
        <ProposalDocument content={item.proposal_content as JSONContent} />
      </div>
    );
  }

  return (
    <>
      {item.project_description && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#59645d]">{item.project_description}</p>}
      {item.technology_stack && (
        <p className="mt-1 text-xs leading-5 text-[#59645d]">
          <span className="font-semibold text-[#203028]">Technology stack:</span> {item.technology_stack}
        </p>
      )}
    </>
  );
}
