import StarterKit from "@tiptap/starter-kit";

// What a title proposal may contain: plain paragraphs with bold, italic, underline and lists. Everything else a paste
// brings along (headings, colours, fonts, pictures, links) is left out, so every proposal looks the same to the adviser.
export const proposalExtensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    codeBlock: false,
    code: false,
    strike: false,
    horizontalRule: false,
    link: false,
  }),
];

// Tailwind has no list styles of its own, so the document gets them here (the same for writing and reading).
export const proposalBodyClass =
  "text-sm leading-7 text-[#203028] outline-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li_p]:my-0";
