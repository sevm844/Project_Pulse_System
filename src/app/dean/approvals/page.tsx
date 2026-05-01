"use client";

import { useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { finalApprovals } from "../_data/mockDeanData";

export default function DeanApprovalsPage() {
  const [items, setItems] = useState(finalApprovals);

  function updateStatus(id: number, status: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  return (
    <DeanShell title="Final Approvals">
      <div className="space-y-5">
        {items.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#203028]">
                    {item.groupName}
                  </h2>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-sm text-[#7b877f]">
                  {item.projectTitle}
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[
                    ["Final Manuscript", item.finalManuscript],
                    ["Grammarian Certificate", item.grammarianCertificate],
                    ["Records Validation", item.recordsValidation],
                    ["Final Requirements", item.finalRequirements],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-[#f8faf7] p-4">
                      <p className="text-xs text-[#7b877f]">{label}</p>
                      <p className="mt-2 text-sm font-semibold text-[#203028]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-w-[220px] flex-col gap-2">
                <button
                  onClick={() => updateStatus(item.id, "Approved")}
                  className="rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                >
                  Approve Final Output
                </button>
                <button
                  onClick={() => updateStatus(item.id, "Returned")}
                  className="rounded-lg border border-[#dfe8df] px-4 py-2.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Return for Revision
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DeanShell>
  );
}
