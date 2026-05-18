export default function DashboardSearchIcon() {
  return (
    <button
      type="button"
      aria-label="Search"
      title="Search"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white transition hover:bg-[#f3f7f1]"
    >
      <span className="relative block h-4 w-4" aria-hidden="true">
        <span className="absolute left-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-[#7b877f]" />
        <span className="absolute bottom-0 right-0 h-2 w-0.5 rotate-[-45deg] rounded-full bg-[#7b877f]" />
      </span>
    </button>
  );
}
