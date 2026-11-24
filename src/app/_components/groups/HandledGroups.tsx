"use client";

import { useEffect, useState } from "react";
import { fetchAdvising, type AdvisingRow } from "../../_lib/advisers";
import { formatDateTime } from "../../_lib/requirements";
import RowToggle from "../RowToggle";

// The AppDev adviser's history: the groups she handled in AppDev and handed over to a Capstone and a Technical adviser. Read only: she keeps the credit of having
// handled them, but the groups are no longer hers to work on. A group she kept (she named herself for a slot) stays in her normal list instead.
export default function HandledGroups({ reloadKey = 0 }: { reloadKey?: number }) {
  const [rows, setRows] = useState<AdvisingRow[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchAdvising()
      .then((advising) => {
        if (!cancelled) setRows(advising.handed_off);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="group flex w-full items-center gap-4 text-left">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[#203028]">Handled in AppDev ({rows.length})</h2>
          <p className="mt-0.5 text-sm text-[#7b877f]">Groups you handled in AppDev and handed over to their Capstone and Technical advisers. They stay here as your record.</p>
        </div>
        <RowToggle open={open} />
      </button>

      {open && (
        <ul className="mt-4 divide-y divide-[#edf2ec]">
          {rows.map((row) => (
            <li key={row.project_id} className="py-3">
              <p className="text-sm font-semibold text-[#203028]">{row.group_name}</p>
              <p className="mt-0.5 text-xs text-[#59645d]">
                {row.course} {row.section}
                {row.project_title ? ` · ${row.project_title}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-[#7b877f]">
                Capstone adviser: {row.capstone_adviser ?? "-"} · Technical adviser: {row.technical_adviser ?? "-"}
                {row.handed_off_at ? ` · Handed over ${formatDateTime(row.handed_off_at)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
