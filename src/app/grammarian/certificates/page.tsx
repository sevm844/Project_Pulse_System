import GrammarianShell from "../_components/GrammarianShell";
import Card from "../_components/Card";
import { grammarReviews } from "../_data/grammarianData";

export default function GrammarianCertificatesPage() {
  const certificates = grammarReviews.filter(
    (item) => item.certificateStatus === "Issued",
  );

  return (
    <GrammarianShell title="Certificates">
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
                    {item.issuedAt}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Issued
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </GrammarianShell>
  );
}
