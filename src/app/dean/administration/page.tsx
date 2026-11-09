import Link from "next/link";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";

const tools = [
  ["Users", "Create staff accounts, change roles, disable accounts and reset passwords.", "/dean/administration/users"],
  ["Groups", "Assign advisers and confirm group closures.", "/dean/administration/groups"],
  ["Audit Logs", "Review who did what across the system.", "/dean/administration/audit-logs"],
  ["Messaging Window", "Set the hours when students may send messages.", "/dean/administration/message-settings"],
] as const;

export default function DeanAdministrationPage() {
  return (
    <DeanShell title="Administration">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">Dean Administration</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            System setup and account controls in one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {tools.map(([title, description, href]) => (
            <Link key={href} href={href}>
              <Card className="h-full p-5 transition hover:bg-[#fbfdfb]">
                <p className="text-sm font-semibold text-[#203028]">{title}</p>
                <p className="mt-2 text-xs leading-5 text-[#59645d]">{description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DeanShell>
  );
}
