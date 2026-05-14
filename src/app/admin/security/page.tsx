import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import Card from "../_components/Card";

const securityControls = [
  {
    title: "Firebase Authentication",
    detail:
      "Users sign in with Firebase Authentication using approved email and password credentials.",
    status: "Implemented",
  },
  {
    title: "Role-Based Access",
    detail:
      "User role is stored in session storage and checked before opening role-specific dashboards.",
    status: "Implemented",
  },
  {
    title: "Account Status Check",
    detail:
      "Login only continues when the Firestore user profile status is Active.",
    status: "Implemented",
  },
  {
    title: "Protected Data Separation",
    detail:
      "Student, adviser, dean, admin, coordinator, panelist, grammarian, and records staff pages are separated by role.",
    status: "Implemented",
  },
];

const protectedRoutes = [
  ["Student", "/student"],
  ["Adviser", "/adviser"],
  ["Dean", "/dean"],
  ["Admin", "/admin"],
  ["Coordinator", "/coordinator"],
  ["Panelist", "/panelist"],
  ["Grammarian", "/grammarian"],
  ["Records Staff", "/records"],
];

export default function AdminSecurityPage() {
  return (
    <AdminShell title="Security">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            System Security
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Monitor authentication, role-based access, protected data areas, and
            audit trail readiness.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Authentication", "Firebase Auth"],
            ["Access Control", "Role Based"],
            ["Account Status", "Active Only"],
            ["Audit Trail", "Enabled"],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-xl font-semibold text-[#203028]">
                {value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Security Implementation
            </h3>

            <div className="mt-5 space-y-3">
              {securityControls.map((control) => (
                <div
                  key={control.title}
                  className="rounded-xl bg-[#f8faf7] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#203028]">
                      {control.title}
                    </p>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {control.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#59645d]">
                    {control.detail}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Protected Role Routes
            </h3>

            <div className="mt-5 space-y-3">
              {protectedRoutes.map(([role, route]) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-xl bg-[#f8faf7] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[#203028]">
                    {role}
                  </p>
                  <p className="text-xs font-semibold text-[#4f8f58]">
                    {route}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/admin/audit-logs"
              className="mt-5 inline-flex rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
            >
              View Audit Logs
            </Link>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
