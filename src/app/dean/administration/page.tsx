import Link from "next/link";
import DeanShell from "../_components/DeanShell";

// The Dean's administration hub: three kinds of tools, each with its own layout so the page is easy to scan and fills the screen.
type Icon = "users" | "groups" | "audit" | "clock" | "mail" | "doc";

const PATHS: Record<Icon, string> = {
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM20 19v-1.4a3.2 3.2 0 0 0-2.4-3.1M15.5 4.8a3.2 3.2 0 0 1 0 6.1",
  groups: "M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z",
  audit: "M12 3.5 5 6v5.5c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V6l-7-2.5ZM9 12l2.2 2.2L15.2 10",
  clock: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 7.5V12l3 2",
  mail: "M4 6.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM3.5 7.5 12 13.5l8.5-6",
  doc: "M7 3.5h6.5L18 8v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5ZM13 3.5V8h4.5M9 12.5h6M9 16h6",
};

function AdminIcon({ name, className = "h-6 w-6" }: { name: Icon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-end gap-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#123f2b]">{title}</h3>
        <p className="mt-0.5 text-xs text-[#7b877f]">{text}</p>
      </div>
      <span className="mb-1.5 h-px flex-1 bg-[#dfe8df]" aria-hidden />
    </div>
  );
}

const open = <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2f6b3c] group-hover:underline">Open <span aria-hidden>→</span></span>;
const cardBase = "group block rounded-2xl border border-[#dfe8df] bg-white shadow-[0_8px_24px_rgba(31,42,36,0.06)] transition hover:-translate-y-0.5 hover:border-[#123f2b] hover:shadow-[0_14px_30px_rgba(31,42,36,0.1)]";

export default function DeanAdministrationPage() {
  return (
    <DeanShell title="Administration">
      <div className="space-y-8">
        <div className="rounded-2xl bg-[#154530] px-6 py-6 text-white shadow-[0_12px_30px_rgba(18,63,43,0.25)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a8e87a]">Administration</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Dean Administration</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d7f7d8]">
            Accounts, groups, the activity record and the checks that keep the system running, in one place.
          </p>
        </div>

        <section className="space-y-3" aria-label="People and groups">
          <Section title="People and groups" text="Who can use the system, and which group each student is in." />
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/dean/administration/users" className={`${cardBase} p-6`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#154530] text-white"><AdminIcon name="users" className="h-7 w-7" /></span>
              <p className="mt-5 text-lg font-semibold text-[#203028]">Users</p>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-[#59645d]">Create staff accounts, change roles, disable accounts and send password links.</p>
              {open}
            </Link>
            <Link href="/dean/administration/groups" className={`${cardBase} p-6`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#154530] text-white"><AdminIcon name="groups" className="h-7 w-7" /></span>
              <p className="mt-5 text-lg font-semibold text-[#203028]">Groups</p>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-[#59645d]">Assign advisers and confirm group closures.</p>
              {open}
            </Link>
          </div>
        </section>

        <section className="space-y-3" aria-label="Oversight">
          <Section title="Oversight" text="A record of what happened, kept by the system." />
          <Link href="/dean/administration/audit-logs" className={`${cardBase} flex flex-col gap-5 p-6 sm:flex-row sm:items-center`}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d7f7d8] text-[#123f2b]"><AdminIcon name="audit" className="h-7 w-7" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-[#203028]">Audit Logs</p>
              <p className="mt-1 text-sm leading-6 text-[#59645d]">Review who did what across the system, with the date and time of each action.</p>
              <p className="mt-2 text-xs text-[#7b877f]">Sign-ins · Account changes · Group removals and closures · Defense results · Imports</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#2f6b3c] group-hover:underline">Open <span aria-hidden>→</span></span>
          </Link>
        </section>

        <section className="space-y-3" aria-label="System checks">
          <Section title="System checks" text="Settings and tests to run before a session or when something is not arriving." />
          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                ["clock", "Messaging Window", "Set the hours when students may send messages.", "/dean/administration/message-settings"],
                ["mail", "Email Check", "Make sure emails really reach people, and send yourself a test.", "/dean/administration/email"],
                ["doc", "Google Docs Check", "See whether the manuscript can be written in Google Docs, and test the connection.", "/dean/administration/google"],
              ] as const
            ).map(([icon, title, text, href]) => (
              <Link key={href} href={href} className={`${cardBase} flex flex-col p-5`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#cfe0d3] bg-[#eef6ef] text-[#123f2b]"><AdminIcon name={icon} className="h-5 w-5" /></span>
                <p className="mt-4 text-sm font-semibold text-[#203028]">{title}</p>
                <p className="mt-1.5 flex-1 text-xs leading-5 text-[#59645d]">{text}</p>
                {open}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DeanShell>
  );
}
