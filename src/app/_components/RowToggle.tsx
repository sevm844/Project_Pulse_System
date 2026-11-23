// The "Open" / "Close" control at the right end of every row that opens and closes (a title proposal, a group's submission, ...).
// It is drawn as a real button, always the same width so every row lines up in one column. The whole row is the click target
// (the row itself is the <button>, give it the `group` class), so this is only its picture. Use it for every such row.
export default function RowToggle({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex w-24 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#cfe0d3] bg-white px-3 py-1.5 text-xs font-semibold text-[#123f2b] transition group-hover:border-[#123f2b] group-hover:bg-[#e8f1ea]"
    >
      {open ? "Close" : "Open"}
      <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 4.5 6 8l3.5-3.5" />
      </svg>
    </span>
  );
}
