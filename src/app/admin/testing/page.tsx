import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import Card from "../_components/Card";

export default function AdminTestingPage() {
  return (
    <AdminShell title="Testing">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Testing & Quality Assurance
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Open the QA dashboard to review functional tests, performance
            checks, bug reports, fixes, and retesting status.
          </p>

          <Link
            href="/admin/qa"
            className="mt-5 inline-flex rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            Open QA Dashboard
          </Link>
        </Card>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            [
              "Functional Testing",
              "Feature tests and workflow validation for login, documents, feedback, defense, final approval, archive, and audit logs.",
            ],
            [
              "Performance Testing",
              "Responsiveness checks for desktop and mobile layouts plus scalability notes for records and repository modules.",
            ],
            [
              "Bug Resolution",
              "Issue tracking, fix status, and retesting records for system quality assurance.",
            ],
          ].map(([title, detail]) => (
            <Card key={title} className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#59645d]">
                {detail}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
