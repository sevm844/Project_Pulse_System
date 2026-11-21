import { Extension, Node, mergeAttributes } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import type { CollabProvider } from "../../_lib/collab";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { Pagination } from "./pagination";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: { setPageBreak: () => ReturnType };
    blockFormat: {
      setLineSpacing: (value: string) => ReturnType;
      setFirstLineIndent: (value: string | null) => ReturnType;
    };
  }
}

// A page break: the next chapter starts on a new page (shown as a dashed line while editing, a real break when exported).
const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML: () => [{ tag: "div[data-page-break]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-page-break": "true" })],
  addCommands() {
    // An empty paragraph follows, so the cursor lands after the break instead of on it (typing on it would replace it).
    return { setPageBreak: () => ({ chain }) => chain().insertContent([{ type: "pageBreak" }, { type: "paragraph" }]).run() };
  },
});

// Pasted papers say "150%" or ".5in"; the editor keeps "1.5" and "0.5in". Anything else falls back to the default.
function spacingOf(value: string): string | null {
  const match = /^(\d+(?:\.\d+)?)(%?)$/.exec(value.trim());
  if (!match) return null;
  const number = match[2] ? parseFloat(match[1]) / 100 : parseFloat(match[1]);

  return number >= 0.5 && number <= 5 ? String(Math.round(number * 100) / 100) : null;
}

function indentOf(value: string): string | null {
  const match = /^(\d*\.?\d+)(pt|px|in|cm)$/.exec(value.trim());
  if (!match) return null;
  const number = parseFloat(match[1]);

  return number > 0 && number < 100 ? `${number}${match[2]}` : null;
}

// Line spacing and the first-line indent belong to a whole paragraph, so they are block attributes, not text styles.
const BlockFormat = Extension.create({
  name: "blockFormat",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => spacingOf(element.style.lineHeight),
            // 1.5 means 1.5 lines the way Word and Google Docs count them: a line of Arial is about 1.15 times its size.
            renderHTML: (attributes) => (attributes.lineHeight ? { style: `line-height: calc(${attributes.lineHeight} * 1.15)` } : {}),
          },
          textIndent: {
            default: null,
            parseHTML: (element) => indentOf(element.style.textIndent),
            renderHTML: (attributes) => (attributes.textIndent ? { style: `text-indent: ${attributes.textIndent}` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineSpacing: (value: string) => ({ chain }) =>
        chain().updateAttributes("paragraph", { lineHeight: value }).updateAttributes("heading", { lineHeight: value }).run(),
      setFirstLineIndent: (value: string | null) => ({ chain }) =>
        chain().updateAttributes("paragraph", { textIndent: value }).updateAttributes("heading", { textIndent: value }).run(),
    };
  },
});

// Everything a manuscript can hold. The server accepts exactly this set and nothing else (ManuscriptContent.php).
// The other members' cursor: a thin coloured line with the person's name on top, and their selection tinted in the same colour.
const renderCaret = (user: Record<string, string>) => {
  const caret = document.createElement("span");
  caret.classList.add("collaboration-carets__caret");
  caret.style.borderColor = user.color;
  const label = document.createElement("div");
  label.classList.add("collaboration-carets__label");
  label.style.backgroundColor = user.color;
  label.textContent = user.name;
  caret.appendChild(label);

  return caret;
};

export type CollabSetup = { provider: CollabProvider; user: { name: string; color: string; userId: number } };

// `collab` is given only to the student's own editor: the document then lives in a shared Yjs document (with its own undo), and the other
// members' cursors show. Every read-only view (versions, review, preview) builds the same editor without it.
export const createManuscriptExtensions = (onPages?: (pages: number) => void, collab?: CollabSetup) => [
  StarterKit.configure({
    ...(collab ? { undoRedo: false as const } : {}),
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["mailto"] },
  }),
  TextStyleKit.configure({ lineHeight: false, backgroundColor: false }),
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Subscript,
  Superscript,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  Image.configure({ inline: false, allowBase64: true }),
  PageBreak,
  BlockFormat,
  Pagination.configure({ onPages }),
  ...(collab
    ? [
        Collaboration.configure({ document: collab.provider.doc }),
        CollaborationCaret.configure({
          provider: { awareness: collab.provider.awareness },
          user: collab.user,
          render: renderCaret,
          selectionRender: (user: Record<string, string>) => ({ nodeName: "span", class: "collaboration-carets__selection", style: `background-color: ${user.color}26` }),
        }),
      ]
    : []),
];
