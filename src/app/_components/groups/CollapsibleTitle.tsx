"use client";

import { useState, type ReactNode } from "react";
import { titleStatusClass } from "../ProposalStage";
import RowToggle from "../RowToggle";
import type { ApiTitleSubmission } from "../../_lib/groups";

// One title proposal as a closed row: the title, who sent it and when, its status, and an Open button. Click the row to read the
// proposal and the remarks below. A group with many revisions or rejections stays short; only the proposal being read is open.
// The status and the Open button sit in fixed columns, so every row lines up.
export default function CollapsibleTitle({
  title,
  meta,
  status,
  children,
}: {
  title: string;
  meta: string;
  status: ApiTitleSubmission["title_status"];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#203028]">{title}</p>
          <p className="mt-0.5 text-[11px] text-[#9aa59e]">{meta}</p>
        </div>

        <span className={`w-28 shrink-0 text-xs font-semibold ${titleStatusClass[status]}`}>{status}</span>
        <RowToggle open={open} />
      </button>

      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
