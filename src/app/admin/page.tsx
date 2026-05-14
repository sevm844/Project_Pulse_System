import Link from "next/link";
import AdminShell from "./_components/AdminShell";
import Card from "./_components/Card";
import AdminCalendar from "./_components/AdminCalendar";

const overviewStats = [
  ["Users", "24", "Active accounts"],
  ["Requests", "3", "Pending review"],
  ["Groups", "12", "Configured groups"],
  ["Courses", "5", "Active programs"],
  ["Advisers", "8", "Assigned faculty"],
];

const quickActions = [
  ["Manage Users", "Update status, roles, and account access.", "/admin/users"],
  [
    "Review Requests",
    "Verify pending registration requests.",
    "/admin/register-requests",
  ],
  [
    "Assign Groups",
    "Maintain course, section, and adviser assignments.",
    "/admin/groups",
  ],
  ["Audit Logs", "Review important system activity.", "/admin/audit-logs"],
];

const recentRequests = [
  ["Maria Santos", "Adviser", "Pending"],
  ["Records Office", "Records", "Pending"],
  ["Grammar Reviewer", "Grammarian", "Pending"],
];

const setupStatus = [
  ["Courses & Sections", "5 courses active", "Complete"],
  ["Adviser Assignments", "8 advisers assigned", "Active"],
  ["Panelist Directory", "4 panelists listed", "Needs Review"],
  ["Academic Term", "2025-2026 / 2nd Semester", "Active"],
];

function statusClasses(status: string) {
  if (status === "Complete" || status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Admin Dashboard">
      <div
  className="grid gap-5"
  style={{ gridTemplateColumns: "minmax(0, 1fr) 360px" }}
>
        <div className="min-w-0 space-y-5">
          <Card className="overflow-x-auto p-4">
            <div className="flex min-w-[640px] divide-x divide-[#edf2ec]">
              {overviewStats.map(([label, value, caption]) => (
                <div key={label} className="flex-1 px-4 py-2">
                  <p className="text-[11px] font-semibold text-[#7b877f]">
                    {label}
                  </p>
                  <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                    <p className="text-2xl font-semibold leading-none text-[#203028]">
                      {value}
                    </p>
                    <p className="pb-0.5 text-[10px] leading-4 text-[#7b877f]">
                      {caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Admin Actions
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Common setup and account management shortcuts.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {quickActions.map(([title, caption, href]) => (
                <Link key={href} href={href}>
                  <div className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4 transition hover:border-[#bfe9c5] hover:bg-[#f3fff4]">
                    <p className="text-sm font-semibold text-[#203028]">
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#59645d]">
                      {caption}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Registration Queue
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Staff accounts waiting for admin verification.
              </p>

              <div className="mt-5 space-y-3">
                {recentRequests.map(([name, role, status]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#f8faf7] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {name}
                      </p>
                      <p className="text-xs text-[#7b877f]">{role}</p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                System Setup Status
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Current academic and assignment configuration.
              </p>

              <div className="mt-5 space-y-3">
                {setupStatus.map(([label, detail, status]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#203028]">
                        {label}
                      </p>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                          status,
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#59645d]">{detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <aside className="min-w-0 self-start sticky top-6">
          <AdminCalendar />
        </aside>
      </div>
    </AdminShell>
  );
}
