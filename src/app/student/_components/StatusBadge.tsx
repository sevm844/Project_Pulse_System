function statusClass(status: string) {
  if (status === "Approved" || status === "Verified" || status === "Completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status === "Needs Revision" ||
    status === "Pending" ||
    status === "In Progress"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Under Review" || status === "Submitted") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
}
