"use client";

import { useEffect, useState } from "react";
import GrammarianShell from "../_components/GrammarianShell";
import Card from "../_components/Card";
import {
  getStoredGrammarReviews,
  type GrammarReviewAssignment,
} from "../../_utils/grammarReviewStorage";

const certificateTemplate = {
  name: "Grammarian Certificate Template",
  format: "In-system generator",
  owner: "Grammarian Office",
  fields: [
    "{PROJECT_TITLE}",
    "{GROUP_NAME}",
    "{MEMBERS}",
    "{COURSE_SECTION}",
    "{ISSUED_DATE}",
    "{GRAMMARIAN_NAME}",
  ],
};

export default function GrammarianCertificatesPage() {
  const [items, setItems] = useState<GrammarReviewAssignment[]>([]);

  useEffect(() => {
    queueMicrotask(() => setItems(getStoredGrammarReviews()));
  }, []);

  const certificates = items.filter(
    (item) => item.certificateStatus === "Issued",
  );

  return (
    <GrammarianShell title="Certificates">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b877f]">
                Certificate Template
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#203028]">
                Official Grammarian Certification Format
              </h2>
              <p className="mt-2 text-sm text-[#59645d]">
                Certificates are generated inside the system after the
                grammarian marks a routed manuscript as certified.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Template", certificateTemplate.name],
                ["Format", certificateTemplate.format],
                ["Owner", certificateTemplate.owner],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#edf2ec] bg-[#fbfdfb] px-4 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b877f]">
                    {label}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#203028]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

          </div>

          <div className="mt-5 border-t border-[#edf2ec] pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b877f]">
              Template placeholders
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {certificateTemplate.fields.map((field) => (
                <span
                  key={field}
                  className="rounded-full border border-[#dfe8df] bg-[#fbfdfb] px-3 py-1.5 text-xs font-semibold text-[#203028]"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Grammarian Certificate Registry
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Issued certificates for manuscripts that completed grammar review.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Certificate No.</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Document</th>
                  <th className="px-5 py-3 font-medium">Sent to Dean</th>
                  <th className="px-5 py-3 font-medium">Issued Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {certificates.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {item.certificateNumber}
                    </td>
                    <td className="px-5 py-4">{item.groupName}</td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {item.projectTitle}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {item.documentTitle}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {item.certificateFile || "Generated in system"}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {item.issuedAt}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Issued
                      </span>
                    </td>
                  </tr>
                ))}

                {certificates.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-[#7b877f]"
                    >
                      No generated grammar certificates yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </GrammarianShell>
  );
}
