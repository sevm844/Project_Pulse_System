import Link from "next/link";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";

const administrationGroups = [
  {
    title: "Accounts",
    description: "Approve registrations, manage users, and adjust permissions.",
    links: [
      ["Users", "/dean/administration/users"],
      ["Registration Requests", "/dean/administration/register-requests"],
      ["Roles & Permissions", "/dean/administration/roles"],
    ],
  },
  {
    title: "Academic Setup",
    description: "Maintain the courses, sections, groups, and academic terms.",
    links: [
      ["Courses & Sections", "/dean/administration/courses"],
      ["Groups", "/dean/administration/groups"],
      ["Academic Terms", "/dean/administration/terms"],
    ],
  },
  {
    title: "Assignments",
    description: "Control adviser and panelist assignments from one area.",
    links: [
      ["Adviser Assignments", "/dean/administration/advisers"],
      ["Panelist Assignments", "/dean/administration/panelists"],
    ],
  },
  {
    title: "System Control",
    description: "Review activity logs and configure communication settings.",
    links: [
      ["Audit Logs", "/dean/administration/audit-logs"],
      ["Messaging Window", "/dean/administration/message-settings"],
    ],
  },
] as const;

const priorityActions = [
  ["Pending Requests", "Review new staff account requests.", "/dean/administration/register-requests"],
  ["User Access", "Update role and account status.", "/dean/administration/users"],
  ["Term Setup", "Check active semester and milestones.", "/dean/administration/terms"],
  ["Audit Review", "Inspect important system activity.", "/dean/administration/audit-logs"],
] as const;

export default function DeanAdministrationPage() {
  return (
    <DeanShell title="Administration">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Dean Administration
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            System setup and account controls are grouped here so the main Dean
            sidebar stays simple while every admin tool remains available.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {priorityActions.map(([title, description, href]) => (
            <Link key={href} href={href}>
              <Card className="h-full p-5 transition hover:bg-[#fbfdfb]">
                <p className="text-sm font-semibold text-[#203028]">{title}</p>
                <p className="mt-2 text-xs leading-5 text-[#59645d]">
                  {description}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {administrationGroups.map((group) => (
            <Card key={group.title} className="p-5">
              <h3 className="text-lg font-semibold text-[#203028]">
                {group.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#7b877f]">
                {group.description}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {group.links.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm font-semibold text-[#203028] transition hover:bg-[#f3f7f1]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DeanShell>
  );
}
