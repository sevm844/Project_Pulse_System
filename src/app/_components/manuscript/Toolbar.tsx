"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState, type ReactNode } from "react";
import { DEFAULT_FONT, DEFAULT_SIZE, FONT_FAMILIES, FONT_SIZES, LINE_SPACINGS } from "../../_lib/manuscript";
import { imageToDataUrl } from "./images";

const HIGHLIGHTS: { label: string; color: string | null }[] = [
  { label: "No highlight", color: null },
  { label: "Yellow", color: "#fff59d" },
  { label: "Green", color: "#c8e6c9" },
  { label: "Blue", color: "#bbdefb" },
  { label: "Pink", color: "#f8bbd0" },
];

// What a heading looks like when the student has not picked a size, so the size box shows the right number.
const HEADING_SIZE: Record<number, number> = { 1: 14, 2: 12, 3: 11 };

const selectClass =
  "h-8 rounded-md border border-[#dfe8df] bg-white px-2 text-xs text-[#203028] outline-none focus:border-[#123f2b] disabled:opacity-50";

function Btn({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection: clicking a button must not move focus out of the page.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-xs font-semibold transition disabled:opacity-40 ${
        active ? "bg-[#123f2b] text-white" : "text-[#203028] hover:bg-[#eef3ee]"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-[#dfe8df]" aria-hidden />;

export default function Toolbar({ editor, onError }: { editor: Editor; onError: (message: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const on = editor.isEditable;
  const chain = () => editor.chain().focus();

  const level = [1, 2, 3].find((item) => editor.isActive("heading", { level: item }));
  const style = level === 1 ? "chapter" : level === 2 ? "h1" : level === 3 ? "h2" : "body";

  const textStyle = editor.getAttributes("textStyle") as { fontFamily?: string; fontSize?: string; color?: string };
  const family = (textStyle.fontFamily ?? DEFAULT_FONT).split(",")[0].replace(/["']/g, "").trim();
  const sizeNumber = textStyle.fontSize ? parseFloat(textStyle.fontSize) : level ? HEADING_SIZE[level] : DEFAULT_SIZE;
  const block = editor.getAttributes(level ? "heading" : "paragraph") as { lineHeight?: string | null; textIndent?: string | null };
  const highlight = (editor.getAttributes("highlight") as { color?: string }).color ?? null;

  function setStyle(value: string) {
    if (value === "body") chain().setParagraph().run();
    else chain().setHeading({ level: value === "chapter" ? 1 : value === "h1" ? 2 : 3 }).run();
  }

  async function addImage(file: File | undefined) {
    if (!file) return;

    try {
      const src = await imageToDataUrl(file);
      // A paragraph follows the picture so the cursor lands after it (typing over a selected picture would delete it).
      chain()
        .insertContent([{ type: "image", attrs: { src, alt: file.name.replace(/\.[^.]+$/, "") } }, { type: "paragraph" }])
        .run();
    } catch (err) {
      onError(err instanceof Error ? err.message : "That image could not be added.");
    }

    if (fileRef.current) fileRef.current.value = "";
  }

  function applyLink() {
    const raw = linkValue.trim();
    if (!raw) {
      chain().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }

    const href = /^(https?:\/\/|mailto:)/i.test(raw) ? raw : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? `mailto:${raw}` : `https://${raw}`;
    chain().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }

  return (
    <div className="sticky top-0 z-10 border-b border-[#dfe8df] bg-white px-2 py-1.5" role="toolbar" aria-label="Formatting">
      <div className="flex flex-wrap items-center gap-0.5">
        <Btn title="Undo" disabled={!on || !editor.can().undo()} onClick={() => chain().undo().run()}>↶</Btn>
        <Btn title="Redo" disabled={!on || !editor.can().redo()} onClick={() => chain().redo().run()}>↷</Btn>
        <Sep />

        <select aria-label="Paragraph style" disabled={!on} value={style} onChange={(event) => setStyle(event.target.value)} className={`${selectClass} w-32`}>
          <option value="body">Body</option>
          <option value="chapter">Chapter</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
        </select>
        <select
          aria-label="Font"
          disabled={!on}
          value={FONT_FAMILIES.includes(family) ? family : DEFAULT_FONT}
          onChange={(event) => chain().setFontFamily(event.target.value).run()}
          className={`${selectClass} w-36`}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
          ))}
        </select>
        <select
          aria-label="Font size"
          disabled={!on}
          value={FONT_SIZES.includes(sizeNumber) ? sizeNumber : DEFAULT_SIZE}
          onChange={(event) => chain().setFontSize(`${event.target.value}pt`).run()}
          className={`${selectClass} w-16`}
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <Sep />

        <Btn title="Bold" active={editor.isActive("bold")} disabled={!on} onClick={() => chain().toggleBold().run()}><b>B</b></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} disabled={!on} onClick={() => chain().toggleItalic().run()}><i>I</i></Btn>
        <Btn title="Underline" active={editor.isActive("underline")} disabled={!on} onClick={() => chain().toggleUnderline().run()}><u>U</u></Btn>
        <Btn title="Strikethrough" active={editor.isActive("strike")} disabled={!on} onClick={() => chain().toggleStrike().run()}><s>S</s></Btn>
        <Btn title="Superscript" active={editor.isActive("superscript")} disabled={!on} onClick={() => chain().toggleSuperscript().run()}>x²</Btn>
        <Btn title="Subscript" active={editor.isActive("subscript")} disabled={!on} onClick={() => chain().toggleSubscript().run()}>x₂</Btn>
        <label title="Text color" className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-xs font-bold hover:bg-[#eef3ee]">
          <span style={{ borderBottom: `3px solid ${textStyle.color ?? "#111111"}` }}>A</span>
          <input
            type="color"
            aria-label="Text color"
            disabled={!on}
            value={/^#[0-9a-f]{6}$/i.test(textStyle.color ?? "") ? textStyle.color : "#111111"}
            onChange={(event) => chain().setColor(event.target.value).run()}
            className="sr-only"
          />
        </label>
        <select
          aria-label="Highlight"
          disabled={!on}
          value={highlight ?? ""}
          onChange={(event) => (event.target.value ? chain().setHighlight({ color: event.target.value }).run() : chain().unsetHighlight().run())}
          className={`${selectClass} w-28`}
        >
          {HIGHLIGHTS.map((item) => (
            <option key={item.label} value={item.color ?? ""}>{item.label}</option>
          ))}
        </select>
        <Sep />

        <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} disabled={!on} onClick={() => chain().setTextAlign("left").run()}>⇤</Btn>
        <Btn title="Center" active={editor.isActive({ textAlign: "center" })} disabled={!on} onClick={() => chain().setTextAlign("center").run()}>↔</Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} disabled={!on} onClick={() => chain().setTextAlign("right").run()}>⇥</Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: "justify" })} disabled={!on} onClick={() => chain().setTextAlign("justify").run()}>☰</Btn>
        <select
          aria-label="Line spacing"
          disabled={!on}
          value={block.lineHeight ?? "1.5"}
          onChange={(event) => chain().setLineSpacing(event.target.value).run()}
          className={`${selectClass} w-20`}
        >
          {LINE_SPACINGS.map((item) => (
            <option key={item} value={item}>{item}×</option>
          ))}
        </select>
        <Btn
          title="First-line indent (0.5 inch)"
          active={Boolean(block.textIndent)}
          disabled={!on}
          onClick={() => chain().setFirstLineIndent(block.textIndent ? null : "0.5in").run()}
        >
          ⇥¶
        </Btn>
        <Sep />

        <Btn title="Bulleted list" active={editor.isActive("bulletList")} disabled={!on} onClick={() => chain().toggleBulletList().run()}>•</Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} disabled={!on} onClick={() => chain().toggleOrderedList().run()}>1.</Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")} disabled={!on} onClick={() => chain().toggleBlockquote().run()}>❝</Btn>
        <Btn title="Code block" active={editor.isActive("codeBlock")} disabled={!on} onClick={() => chain().toggleCodeBlock().run()}>{"</>"}</Btn>
        <Sep />

        <Btn title="Insert table" disabled={!on} onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</Btn>
        <Btn title="Insert image" disabled={!on} onClick={() => fileRef.current?.click()}>🖼</Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="sr-only"
          aria-label="Choose an image"
          onChange={(event) => void addImage(event.target.files?.[0])}
        />
        <Btn
          title="Link"
          active={editor.isActive("link")}
          disabled={!on}
          onClick={() => {
            setLinkValue((editor.getAttributes("link") as { href?: string }).href ?? "");
            setLinkOpen((open) => !open);
          }}
        >
          🔗
        </Btn>
        <Btn title="Page break" disabled={!on} onClick={() => chain().setPageBreak().run()}>⤓</Btn>
      </div>

      {linkOpen && (
        <form
          className="mt-1.5 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyLink();
          }}
        >
          <input
            autoFocus
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="Paste a link, for example https://example.com (empty removes the link)"
            aria-label="Link address"
            className="h-8 flex-1 rounded-md border border-[#dfe8df] px-2 text-xs outline-none focus:border-[#123f2b]"
          />
          <button type="submit" className="h-8 rounded-md bg-[#123f2b] px-3 text-xs font-semibold text-white">Apply</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="h-8 rounded-md border border-[#dfe8df] px-3 text-xs font-semibold">Cancel</button>
        </form>
      )}

      {editor.isActive("table") && on && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-[#59645d]">
          <span className="mr-1 font-semibold">Table</span>
          <Btn title="Add row below" onClick={() => chain().addRowAfter().run()}>+ Row</Btn>
          <Btn title="Add column after" onClick={() => chain().addColumnAfter().run()}>+ Column</Btn>
          <Btn title="Delete row" onClick={() => chain().deleteRow().run()}>− Row</Btn>
          <Btn title="Delete column" onClick={() => chain().deleteColumn().run()}>− Column</Btn>
          <Btn title="Header row on or off" onClick={() => chain().toggleHeaderRow().run()}>Header row</Btn>
          <Btn title="Merge or split the selected cells" onClick={() => chain().mergeOrSplit().run()}>Merge / split</Btn>
          <Btn title="Delete table" onClick={() => chain().deleteTable().run()}>Delete table</Btn>
        </div>
      )}
    </div>
  );
}
