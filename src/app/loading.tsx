// Shown while a page is being fetched (first load and page changes): a heartbeat line, in the system's green.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 bg-white">
      <svg viewBox="0 0 120 40" className="h-12 w-36" fill="none" aria-hidden="true">
        <path d="M2 22h26l6-14 10 28 8-20 6 6h60" stroke="#dfe8d6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path className="pulse-line" d="M2 22h26l6-14 10 28 8-20 6 6h60" stroke="#3a7f35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm font-semibold text-[#123f2b]">
        Loading<span className="loading-dots" />
      </p>
    </div>
  );
}
