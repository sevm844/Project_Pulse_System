// An icon-only "show / hide the password" button that sits inside the right end of a password box (the box needs `relative` and room on the right, `pr-11`).
export default function PasswordEye({ shown, onClick, label = "password" }: { shown: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${shown ? "Hide" : "Show"} ${label}`}
      aria-pressed={shown}
      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#59645d] hover:bg-[#edf2ec] hover:text-[#123f2b]"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {shown ? (
          <path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.2 9.5 7-.4 1-1.2 2.4-2.5 3.6M6.5 6.6C4.4 8 3 10.2 2.5 12c1 2.8 4.5 7 9.5 7 1.5 0 2.8-.4 4-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        ) : (
          <>
            <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}
