// The close button of a pop-up: a drawn cross exactly in the middle of its box (a typed "x" or "×" always sits a little off centre).
export default function CloseX({ onClick, label = "Close", disabled = false }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#59645d] transition hover:bg-[#f3f7f1] hover:text-[#123f2b] disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
