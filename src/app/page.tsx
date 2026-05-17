"use client";

import Image from "next/image";
import { useState } from "react";

const navLinks = [
  ["About", "#about"],
  ["Features", "#features"],
  ["Workflow", "#workflow"],
  ["FAQ", "#faq"],
];

const mockupBoxes = [
  {
    title: "About Project Pulse",
    eyebrow: "CICT Capstone Office",
    body: "Built for the College of Information and Communication Technology to unify capstone requirements, reviews, approvals, and archive readiness.",
  },
  {
    title: "Centralized Web System",
    eyebrow: "Unified Portal Workspace",
    body: "One secure workspace for student submissions, adviser feedback, panel updates, and administrative monitoring.",
  },
  {
    title: "Multi-Role Dashboards",
    eyebrow: "Role-Based Access",
    body: "Students, Advisers, Panelists, Coordinators, Grammarians, Records Staff, Deans, and Admins each get focused workflows.",
  },
  {
    title: "Defense Scheduling",
    eyebrow: "Core Features",
    body: "Document Versions, Built-in Docs, Messages, final approval tracking, and automated status visibility in one system.",
  },
];

const featureSummaries = [
  {
    title: "Centralized Monitoring",
    body: "Track submissions, revisions, adviser responses, and approval stages from one source of truth.",
  },
  {
    title: "Departmental Integration",
    body: "Connect students, advisers, panelists, grammarians, coordinators, records staff, and admins.",
  },
  {
    title: "Support & Administration",
    body: "Manage accounts, deadlines, announcements, notifications, and audit-ready activity logs.",
  },
];

const leadBenefits = [
  "Natively integrates submissions, reviews, approvals, and archive workflows.",
  "Seamlessly collaborates with advisers, panelists, and department offices.",
  "Flexibly adapts to course sections, group assignments, and capstone guidelines.",
];

const stats = [
  ["100%", "System Document Tracking Accuracy"],
  ["7+", "Role-Based Dashboard Workflows"],
  ["24/7", "Milestone and Deadline Availability"],
];

const faqItems = [
  {
    question: "How do we submit revisions?",
    answer:
      "Students upload the revised document through their assigned checklist or document workspace. Project Pulse stores the new version, keeps the previous version, and shows review status for the adviser and Dean.",
  },
  {
    question: "Can admins adjust submission deadlines?",
    answer:
      "Yes. Admins and authorized coordinators can configure deadlines by course, section, phase, and requirement so each group sees the correct schedule.",
  },
  {
    question: "Who has access to the grade evaluation metrics?",
    answer:
      "Only authorized evaluation roles can access grade metrics. Students can see permitted status updates, while panelists, advisers, and administrators see evaluation data based on their permissions.",
  },
];

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3a7f35]">
      {children}
    </p>
  );
}

function NavIcon({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`block h-9 w-9 rounded-lg border ${
        active
          ? "border-[#c7ff5f] bg-[#c7ff5f] shadow-[0_8px_24px_rgba(199,255,95,0.4)]"
          : "border-[#e4e8ef] bg-white"
      }`}
    />
  );
}

function MiniCalendar() {
  return (
    <div className="rounded-lg border border-[#dfe5ef] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-[#171c19]">Defense Week</p>
        <span className="rounded-full bg-[#c7ff5f] px-3 py-1 text-xs font-bold text-[#171c19]">
          Live
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
          <div key={day}>
            <p className="font-semibold text-[#6a736e]">{day}</p>
            <div
              className={`mt-2 h-12 rounded-lg border ${
                index === 2
                  ? "border-[#171c19] bg-[#c7ff5f]"
                  : "border-[#e5e7ef] bg-[#f9f9ff]"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className="rounded-lg border border-[#dfe5ef] bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-bold text-[#171c19]">
                {item.question}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#171c19] text-lg font-semibold text-white">
                {isOpen ? "-" : "+"}
              </span>
            </button>

            {isOpen && (
              <p className="border-t border-[#edf0f6] px-5 py-4 text-sm leading-7 text-[#4d5751]">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f9f9ff] text-[#171c19]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7ef] bg-[#f9f9ff]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <Image
              src="/logotop.png"
              alt="Project Pulse"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="text-lg font-bold">
              Project <span className="text-[#3a7f35]">Pulse</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#4d5751] md:flex">
            {navLinks.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-[#171c19]">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-lg border border-[#d8dce5] bg-white px-4 py-2 text-sm font-bold text-[#171c19] transition hover:border-[#171c19] sm:inline-flex"
            >
              Log in
            </a>
            <a
              href="/register"
              className="rounded-lg border border-[#171c19] bg-[#c7ff5f] px-4 py-2 text-sm font-bold text-[#171c19] transition hover:bg-[#b8f04f]"
            >
              Create Account
            </a>
          </div>
        </div>
      </header>

      <section
        className="relative overflow-hidden px-5 pb-28 pt-14 text-center lg:px-8 lg:pb-36 lg:pt-16"
        style={{
          background:
            "radial-gradient(circle at 50% 62%, rgba(199, 255, 95, 0.62) 0, rgba(199, 255, 95, 0.34) 24%, rgba(199, 255, 95, 0.12) 52%, rgba(249, 249, 255, 0) 82%), radial-gradient(circle at 18% 72%, rgba(23, 28, 25, 0.08) 0, rgba(23, 28, 25, 0.04) 18%, transparent 42%), radial-gradient(circle at 82% 72%, rgba(23, 28, 25, 0.07) 0, rgba(23, 28, 25, 0.035) 20%, transparent 44%), linear-gradient(180deg, #f9f9ff 0%, #f9f9ff 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#dfe3eb_1px,transparent_1px)] opacity-45 [background-size:24px_24px]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-lg bg-white shadow-[0_18px_48px_rgba(23,28,25,0.12)]">
            <div className="absolute inset-0 -z-10 rounded-lg bg-[#c7ff5f] opacity-45 blur-2xl" />
            <Image
              src="/Logo-icon.png"
              alt="Project Pulse Icon"
              width={42}
              height={42}
              priority
            />
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Unified Capstone Lifecycle Management
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#4d5751]">
            Streamlining your entire capstone journey from proposal to final
            archiving.
          </p>

          <div className="relative z-30 mt-10">
            <a
              href="/login"
              className="relative z-30 inline-flex rounded-lg bg-[#171c19] px-7 py-3.5 text-sm font-bold text-white shadow-[0_16px_40px_rgba(23,28,25,0.2)] transition hover:bg-[#2a302c]"
            >
              Access Your Dashboard
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="relative z-20 -mt-24 bg-transparent px-5 pb-12 pt-8 lg:-mt-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-lg border border-white/45 bg-white/30 p-2 shadow-[0_28px_80px_rgba(23,28,25,0.10)] backdrop-blur-3xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(199,255,95,0.24),transparent_34%),radial-gradient(circle_at_94%_18%,rgba(199,255,95,0.14),transparent_30%)]" />
            <div className="relative grid min-h-[620px] overflow-hidden rounded-lg border border-white/35 bg-white/22 backdrop-blur-3xl lg:grid-cols-[82px_minmax(0,1fr)]">
              <aside className="hidden border-r border-white/35 bg-white/38 px-4 py-7 backdrop-blur-2xl lg:flex lg:flex-col lg:justify-between">
                <div className="space-y-5">
                  <NavIcon active />
                  <NavIcon />
                  <NavIcon />
                  <NavIcon />
                  <NavIcon />
                </div>
                <div className="space-y-4">
                  <span className="block h-8 w-8 rounded-full border border-white/45 bg-white/45 backdrop-blur-xl" />
                  <span className="block h-9 w-9 rounded-full bg-[#171c19]/90" />
                </div>
              </aside>

              <div className="bg-white/10 p-5 backdrop-blur-2xl md:p-7">
                <div className="mb-6 flex flex-col gap-4 rounded-lg border border-white/45 bg-white/34 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_45px_rgba(23,28,25,0.05)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3a7f35]">
                      Project Pulse Workspace
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[#171c19]">
                      Department Capstone Command Center
                    </h2>
                  </div>
                  <div className="rounded-lg bg-[#171c19] px-4 py-2 text-sm font-bold text-[#c7ff5f] shadow-[0_14px_32px_rgba(23,28,25,0.2)]">
                    CICT Portal
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {mockupBoxes.map((box) => (
                    <article
                      key={box.title}
                      className="min-h-[176px] rounded-lg border border-white/38 bg-white/24 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_14px_34px_rgba(23,28,25,0.035)] backdrop-blur-2xl"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3a7f35]">
                        {box.eyebrow}
                      </p>
                      <h3 className="mt-3 text-xl font-bold text-[#171c19]">
                        {box.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[#4d5751]">
                        {box.body}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-5 rounded-lg border border-white/38 bg-white/22 p-3 backdrop-blur-2xl">
                  <div className="flex items-center gap-3 rounded-lg bg-white/34 px-4 py-3 backdrop-blur-xl">
                    <span className="h-3 w-3 rounded-full bg-[#c7ff5f]" />
                    <input
                      readOnly
                      value="Ask Project Pulse to find pending revisions, defense schedules, or final approval status..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-[#4d5751] outline-none"
                    />
                    <button className="rounded-lg bg-[#171c19] px-4 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgba(23,28,25,0.18)]">
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featureSummaries.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-[#dfe5ef] bg-white p-6"
              >
                <h3 className="text-lg font-bold text-[#171c19]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#4d5751]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionTag>Guided Capstone Flow</SectionTag>
            <h2 className="mt-4 max-w-xl text-4xl font-bold leading-tight md:text-5xl">
              Lead your capstone to success
            </h2>
            <div className="mt-8 space-y-4">
              {leadBenefits.map((benefit, index) => (
                <div key={benefit} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#c7ff5f] text-sm font-bold text-[#171c19]">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-base leading-7 text-[#4d5751]">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dfe5ef] bg-white p-5 shadow-[0_24px_70px_rgba(23,28,25,0.08)]">
            <div className="rounded-lg bg-[#171c19] p-4 text-white">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-bold">Group Workflow Feed</p>
                <span className="rounded-full bg-[#c7ff5f] px-3 py-1 text-xs font-bold text-[#171c19]">
                  Active
                </span>
              </div>
              <div className="space-y-3">
                {[
                  ["Proposal Submitted", "Student Group", "Completed"],
                  ["Adviser Review", "Anna Cruz", "In progress"],
                  ["Panel Confirmation", "Coordinator", "Queued"],
                  ["Defense Schedule", "Dean Office", "Ready"],
                ].map(([title, owner, status]) => (
                  <div
                    key={title}
                    className="grid gap-3 rounded-lg border border-white/10 bg-white/7 p-4 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-xs text-white/65">{owner}</p>
                    </div>
                    <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-bold text-[#171c19]">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#171c19] px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTag>System Reliability</SectionTag>
          <div className="mt-4 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              Secure, Tracked, and Validated
            </h2>
            <p className="text-base leading-8 text-white/72">
              Project Pulse balances transparency, clarity, and accountability
              across the department by connecting submissions, deadlines,
              version records, user permissions, and administrative logs into a
              single managed environment.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {stats.map(([value, label]) => (
              <article
                key={label}
                className="rounded-lg border border-white/10 bg-white/7 p-6"
              >
                <p className="text-5xl font-bold text-[#c7ff5f]">{value}</p>
                <p className="mt-4 text-sm font-semibold leading-6 text-white/78">
                  {label}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionTag>Features Ecosystem</SectionTag>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Centralized communication, any task, built-in features
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            <article className="rounded-lg border border-[#dfe5ef] bg-white p-5 lg:col-span-2">
              <p className="text-sm font-bold text-[#3a7f35]">
                Built-in Document Editor
              </p>
              <div className="mt-5 rounded-lg border border-[#dfe5ef] bg-[#f9f9ff] p-4">
                <div className="mb-4 flex gap-2">
                  {["B", "I", "H1", "List"].map((tool) => (
                    <span
                      key={tool}
                      className="rounded-lg bg-white px-3 py-1 text-xs font-bold"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-4/5 rounded bg-[#171c19]" />
                  <div className="h-3 w-full rounded bg-[#d8dce5]" />
                  <div className="h-3 w-3/4 rounded bg-[#d8dce5]" />
                  <div className="h-16 rounded-lg bg-white" />
                </div>
              </div>
            </article>

            <article className="rounded-lg border border-[#dfe5ef] bg-white p-5">
              <p className="text-sm font-bold text-[#3a7f35]">
                Automated Alerts
              </p>
              <div className="mt-5 space-y-3">
                {["SMS queued", "Email sent", "Deadline alert"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg bg-[#f9f9ff] px-4 py-3"
                  >
                    <span className="text-sm font-semibold">{item}</span>
                    <span className="h-3 w-3 rounded-full bg-[#c7ff5f]" />
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-[#dfe5ef] bg-white p-5">
              <p className="text-sm font-bold text-[#3a7f35]">
                Defense Calendar
              </p>
              <div className="mt-5">
                <MiniCalendar />
              </div>
            </article>

            <article className="rounded-lg border border-[#dfe5ef] bg-[#171c19] p-6 text-white lg:col-span-4">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-bold text-[#c7ff5f]">
                    Real-Time Tracking
                  </p>
                  <h3 className="mt-3 text-3xl font-bold">
                    From proposal to archiving
                  </h3>
                  <p className="mt-4 leading-7 text-white/72">
                    Each milestone is tracked with status, owner, timestamp,
                    document version, and approval result so no requirement gets
                    lost between offices.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Proposal",
                    "Adviser Review",
                    "Defense",
                    "Grammar Check",
                    "Final Approval",
                    "Archive",
                  ].map((step) => (
                    <div
                      key={step}
                      className="rounded-lg border border-white/10 bg-white/7 px-4 py-3 text-sm font-semibold"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionTag>FAQ</SectionTag>
            <h2 className="mt-4 text-4xl font-bold leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-5 max-w-lg leading-8 text-[#4d5751]">
              Common questions about document revisions, deadline controls, and
              permission-based access for capstone stakeholders.
            </p>
            <a
              href="/contact"
              className="mt-8 inline-flex rounded-lg bg-[#171c19] px-6 py-3 text-sm font-bold text-white"
            >
              Contact Admin / Support
            </a>
          </div>
          <FAQAccordion />
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-[#dfe5ef] bg-white p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_460px] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold">
                  Empower your department today
                </h2>
                <p className="mt-3 leading-7 text-[#4d5751]">
                  Get updates about deployment, training, and department rollout.
                </p>
              </div>
              <form className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter department email"
                  className="h-12 min-w-0 flex-1 rounded-lg border border-[#dfe5ef] px-4 text-sm outline-none focus:border-[#171c19]"
                />
                <button
                  type="button"
                  className="h-12 rounded-lg bg-[#c7ff5f] px-5 text-sm font-bold text-[#171c19]"
                >
                  Notify Me / Contact Admin
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e5e7ef] bg-[#f9f9ff] px-5 py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logotop.png" alt="Project Pulse" width={34} height={34} />
              <p className="font-bold">Project Pulse</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4d5751]">
              Capstone lifecycle management for CICT.
            </p>
          </div>

          <FooterColumn
            title="Navigation"
            links={["About", "Features", "Workflow", "FAQ"]}
          />
          <FooterColumn
            title="Features"
            links={["Document Versions", "Defense Scheduling", "Messages", "Archive Tracking"]}
          />
          <FooterColumn
            title="Technologies"
            links={["Next.js", "Firebase", "Role-Based Access", "Local Prototype Storage"]}
          />
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-[#e5e7ef] pt-6 text-sm text-[#4d5751]">
          © 2026 Project Pulse. All rights reserved. College of Information and
          Communication Technology.
        </div>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#171c19]">{title}</h3>
      <div className="mt-4 space-y-3">
        {links.map((link) => (
          <p key={link} className="text-sm text-[#4d5751]">
            {link}
          </p>
        ))}
      </div>
    </div>
  );
}
