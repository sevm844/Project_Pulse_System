"use client";

import { useState, type ReactNode } from "react";
import { titleStatusClass } from "../ProposalStage";
import type { ApiTitleSubmission } from "../../_lib/groups";

// One title proposal as a closed row: the title, who sent it and when, and its status. Click it to read the proposal and the
// remarks below. A group with many revisions or rejections stays short; only the proposal being read is open.
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
        className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#203028]">{title}</p>
          <p className="mt-0.5 text-[11px] text-[#9aa59e]">{meta}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-semibold ${titleStatusClass[status]}`}>{status}</span>
          <span className="text-xs font-semibold text-[#4f8f58]">{open ? "Hide ▲" : "Open ▼"}</span>
        </div>
      </button>

      {open && <div>{children}</div>}
    </div>
  );
}
