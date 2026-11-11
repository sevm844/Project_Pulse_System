import { Extension, Node, mergeAttributes } from "@tiptap/react";
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
            renderHTML: (attributes) => (attributes.lineHeight ? { style: `line-height: ${attributes.lineHeight}` } : {}),
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
export const createManuscriptExtensions = (onPages?: (pages: number) => void) => [
  StarterKit.configure({
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
];
