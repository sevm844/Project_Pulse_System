type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style =
    status === "Approved" || status === "Ready" || status === "Passed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "At Risk" ||
          status === "Pending" ||
          status === "Needs Revision"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "Returned" || status === "Failed"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : status === "Under Review"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}
