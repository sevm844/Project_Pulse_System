"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import HeroShowcase from "./_components/landing/HeroShowcase";

const navLinks = [
  ["About", "#about"],
  ["Features", "#features"],
  ["Workflow", "#workflow"],
  ["FAQ", "#faq"],
];

// The school's real path, in order. Nothing here is skipped by the system either.
const journey = [
  {
    name: "Title Proposal",
    text: "Write up to three title ideas in a simple editor. Your adviser reads each one and approves it, asks for changes, or turns it down. She also reminds you about the letter for the client interview.",
    who: "You and your adviser",
  },
  {
    name: "Client Consultation",
    text: "Your adviser starts the client consultation. You meet your client, and the Dean for his signature on paper. Then your adviser confirms the one title you will defend, and you are ready for your first defense.",
    who: "You, your adviser and your client",
  },
  {
    name: "Proposal Defense",
    text: "Your group gets a date, a room and a panel. Each panelist scores you on the department's own rubric, ten criteria out of 40. Your adviser records the result.",
    who: "Panel and adviser",
  },
  {
    name: "Alpha, Beta, Omega",
    text: "Three more defenses, always in order. You can only schedule the next one after you pass the one before. The Dean records the results.",
    who: "Panel and Dean",
  },
  {
    name: "Final Defense",
    text: "The last defense. When your group passes, your final manuscript goes to the Grammarian for checking.",
    who: "Panel and Dean",
  },
  {
    name: "Certificate and Archive",
    text: "The Grammarian issues your certification of editing. Your final outputs are received and your project is archived by the Dean's Secretary.",
    who: "Grammarian and Dean's Secretary",
  },
];

const features = [
  {
    title: "Write together, like Google Docs",
    body: "Your whole group types in the same manuscript at once. You see each other's cursors, and every edit is kept in a version history you can go back to.",
    tone: "bg-white text-[#123f2b]",
    soft: "text-[#4d5751]",
  },
  {
    title: "Feedback on the exact words",
    body: "Your adviser highlights a sentence and comments on it. You reply, fix it, and they mark it resolved.",
    tone: "bg-white text-[#123f2b]",
    soft: "text-[#4d5751]",
  },
  {
    title: "Always know what's next",
    body: "A tracker shows where your group stands, from title to archive, and what your next step is.",
    tone: "bg-white text-[#123f2b]",
    soft: "text-[#4d5751]",
  },
  {
    title: "Defense schedule, no guessing",
    body: "See your adviser's whole defense schedule: date, time, room and panel. No room or panelist is ever booked twice.",
    tone: "bg-white text-[#123f2b]",
    soft: "text-[#4d5751]",
  },
  {
    title: "Chat with your group and adviser",
    body: "Direct messages and one group chat for every project, plus notices in the app and by email so nothing slips.",
    tone: "bg-white text-[#123f2b]",
    soft: "text-[#4d5751]",
  },
  {
    title: "Your files, in one place",
    body: "Hand in assignments with version history, bring in a Word file, export your manuscript to PDF or Word, and download forms your adviser or the Dean shares.",
    tone: "bg-white text-[#123f2b]",
    soft: "text-[#4d5751]",
  },
];

const roles = [
  {
    name: "Student",
    lead: "Your whole capstone, one tab away.",
    points: [
      "Write the manuscript with your group, live",
      "Propose titles and hand in assignments",
      "Keep extra documents private, or share them for review",
      "See your schedule, chats and next step",
    ],
  },
  {
    name: "Adviser",
    lead: "Guide your groups without the paper chase.",
    points: [
      "Form groups and add your students",
      "Create assignments for your sections",
      "Approve titles and comment on exact words",
      "Record the Proposal Defense result",
    ],
  },
  {
    name: "Dean",
    lead: "The whole department at a glance.",
    points: [
      "Watch every group's progress from title to archive",
      "Schedule many defenses at once on a sheet",
      "Spot groups at risk before they fall behind",
      "Read the audit log of what happened and who did it",
    ],
  },
  {
    name: "Panelist",
    lead: "Be ready for every defense you sit on.",
    points: [
      "See the defenses you are assigned to",
      "Read the manuscript before the day",
      "Score on the rubric and sign it in the system",
    ],
  },
  {
    name: "Grammarian",
    lead: "Check the final manuscript with care.",
    points: [
      "Receive final manuscripts from the Dean",
      "Comment on exact words",
      "Issue the certification of editing",
    ],
  },
  {
    name: "Dean's Secretary",
    lead: "Records that are always in order.",
    points: [
      "Group folders for every project",
      "Collection tracker for final outputs",
      "Archive records for finished projects",
    ],
  },
];

const gettingStarted = [
  ["Create your account", "Use your UB email (your 7-digit number @ub.edu.ph). You can log in right away."],
  ["Wait for your adviser", "Your adviser adds you to your group. The page checks by itself, so you don't have to keep refreshing."],
  ["Accept and start", "Accept the invitation and your dashboard opens, with your next step ready."],
];

const faqItems = [
  {
    question: "Who can see what I write?",
    answer:
      "Your manuscript is seen by your group, your adviser and the Dean, so everyone knows the work is moving. Extra documents you create are private to your group until you choose to share them with your adviser or the Dean.",
  },
  {
    question: "Can my whole group write at the same time?",
    answer:
      "Yes. Everyone types in the same document and sees each other's cursors. Updates reach your groupmates in a second or two. If your internet drops, your changes are kept and sent when you are back.",
  },
  {
    question: "What if we make a mistake?",
    answer:
      "Nothing is lost. The version history keeps earlier copies of the manuscript, and you can go back to any of them. Versions you submit to your adviser are frozen so the feedback always points at the same words.",
  },
  {
    question: "Can I bring in my Word file?",
    answer:
      "Yes. You can import a .docx into the editor, and export your manuscript to PDF or Word when you need a copy.",
  },
  {
    question: "How do I get into a group?",
    answer:
      "Create your account first. Your adviser then adds you to a group (up to 3 students). Until then, you will see a page that waits for the invitation.",
  },
  {
    question: "I forgot my password.",
    answer:
      "Use \"Forgot password\" on the login page. We email you a one-time link to choose a new one. Nobody else, not even the Dean, ever sets or sees your password.",
  },
];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.18em] ${light ? "text-[#a8e87a]" : "text-[#3a7f35]"}`}>
      {children}
    </p>
  );
}

// A small drawing of the editor: two groupmates typing and the adviser's comment. A sample, not real data.
function EditorPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="landing-float rounded-3xl border border-[#dfe8d6] bg-white p-5 shadow-[0_30px_70px_rgba(18,63,43,0.16)]">
        <div className="flex items-center gap-2 border-b border-[#eef1e8] pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d7f7d8]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#a8e87a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4ac214]" />
          <p className="ml-2 text-xs font-semibold text-[#6a736e]">Chapter 1 · Introduction</p>
        </div>

        <div className="mt-4 space-y-2.5 text-[13px] leading-6 text-[#2c3a31]">
          <p className="font-bold text-[#123f2b]">Background of the Study</p>
          <p>
            Capstone groups at the college still track their work on paper, so{" "}
            <span className="rounded bg-[#d7f7d8] px-0.5">advisers lose track of who has done what</span>
            <span className="relative mx-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-[#123f2b]">
              <span className="absolute -top-5 left-0 whitespace-nowrap rounded-md rounded-bl-none bg-[#123f2b] px-1.5 py-0.5 text-[10px] font-bold text-white">Erin</span>
            </span>
            .
          </p>
          <p>
            This study builds one place where the group writes together,
            <span className="relative mx-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-[#3a7f35]">
              <span className="absolute -top-5 left-0 whitespace-nowrap rounded-md rounded-bl-none bg-[#3a7f35] px-1.5 py-0.5 text-[10px] font-bold text-white">Sheena</span>
            </span>{" "}
            and the adviser can follow along.
          </p>
          <div className="h-2 w-5/6 rounded bg-[#eef1e8]" />
          <div className="h-2 w-2/3 rounded bg-[#eef1e8]" />
        </div>
      </div>

      <div className="landing-float-slow absolute -bottom-7 -right-2 w-60 rounded-2xl border border-[#dfe8d6] bg-white p-3.5 shadow-[0_20px_50px_rgba(18,63,43,0.18)] sm:-right-8">
        <p className="text-[11px] font-bold text-[#3a7f35]">Adviser comment</p>
        <p className="mt-1 text-xs leading-5 text-[#2c3a31]">Good start! Which offices, exactly? Add one example.</p>
        <div className="mt-2 flex gap-3 text-[11px] font-bold text-[#123f2b]">
          <span>Reply</span>
          <span className="text-[#3a7f35]">✓ Resolved</span>
        </div>
      </div>

      <div className="landing-float-slow absolute -left-3 -top-5 rounded-2xl bg-[#123f2b] px-3.5 py-2 text-xs font-bold text-white shadow-lg sm:-left-8">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4ac214]" />
        Proposal Defense · Mon 9:00
      </div>
    </div>
  );
}

function Journey() {
  const [active, setActive] = useState(0);
  const step = journey[active];

  return (
    <div className="mt-10">
      <div role="tablist" aria-label="Capstone journey" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {journey.map((item, index) => {
          const selected = index === active;

          return (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                selected
                  ? "border-[#123f2b] bg-[#123f2b] text-white shadow-md"
                  : "border-[#dfe8d6] bg-white text-[#123f2b] hover:border-[#123f2b]"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${selected ? "bg-white/20" : "bg-[#eef6df]"}`}>
                {index + 1}
              </span>
              {item.name}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-4 grid gap-6 rounded-3xl border border-[#dfe8d6] bg-white p-6 shadow-[0_20px_60px_rgba(18,63,43,0.08)] md:grid-cols-[auto_1fr] md:items-center md:p-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[#dfe8d6] bg-white text-4xl font-extrabold text-[#3a7f35]">{String(active + 1).padStart(2, "0")}</div>
        <div>
          <p className="text-sm font-bold text-[#3a7f35]">
            Step {active + 1} of {journey.length} · {step.who}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-[#123f2b] md:text-3xl">{step.name}</h3>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#4d5751]">{step.text}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => setActive(active - 1)}
              className="rounded-full border border-[#dfe8d6] px-5 py-2 text-sm font-bold text-[#123f2b] transition hover:border-[#123f2b] disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={active === journey.length - 1}
              onClick={() => setActive(active + 1)}
              className="rounded-full bg-[#123f2b] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#0f3324] disabled:opacity-40"
            >
              Next step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// A short mark for a role (its initial), so no picture is needed.
const roleMark = (name: string) => (name === "Dean's Secretary" ? "DS" : name.charAt(0));

function Roles() {
  const [active, setActive] = useState(0);
  const role = roles[active];

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[260px_1fr]">
      <div role="tablist" aria-label="Roles" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {roles.map((item, index) => {
          const selected = index === active;

          return (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={`flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                selected ? "border-[#123f2b] bg-[#123f2b] text-white" : "border-[#dfe8d6] bg-white text-[#123f2b] hover:border-[#123f2b]"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] ${selected ? "bg-white/20 text-white" : "bg-[#eef6df] text-[#123f2b]"}`}>{roleMark(item.name)}</span>
              {item.name}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="rounded-3xl border border-[#dfe8d6] bg-white p-6 md:p-8">
        <p className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dfe8d6] bg-white text-lg font-extrabold text-[#3a7f35]">{roleMark(role.name)}</p>
        <h3 className="mt-3 text-2xl font-bold text-[#123f2b]">{role.name}</h3>
        <p className="mt-1 text-base text-[#4d5751]">{role.lead}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {role.points.map((point) => (
            <li key={point} className="flex gap-3 rounded-2xl border border-[#e3eadd] bg-white p-4 text-sm font-semibold leading-6 text-[#2c3a31]">
              <span className="mt-0.5 text-[#3a7f35]">✓</span>
              {point}
            </li>
          ))}
        </ul>
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
          <div key={item.question} className="rounded-2xl border border-[#dfe8d6] bg-white">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-bold text-[#171c19]">{item.question}</span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#123f2b] text-lg font-semibold text-white">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && <p className="border-t border-[#edf1e6] px-5 py-4 text-sm leading-7 text-[#4d5751]">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  // On a phone the links (About, Features...) and the two buttons live in a menu under the bar.
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white text-[#171c19]">
      <style>{`
        @keyframes landing-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        .landing-float { animation: landing-float 6s ease-in-out infinite; }
        .landing-float-slow { animation: landing-float 8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .landing-float, .landing-float-slow { animation: none; } }
      `}</style>

      {/* Announcement bar, then the navigation, then the big rounded panels: the layout of a modern scheduling site (the user's choice, 2026-11-24), in the system's greens. */}
      <div className="relative z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#d7f7d8] px-4 py-2 text-center text-xs font-semibold text-[#123f2b]">
        <span>Introducing Project Pulse: one place for the whole capstone journey, from proposal to final archive.</span>
        <a href="#about" className="rounded-md border border-[#123f2b]/25 bg-white/70 px-2 py-0.5 text-[11px] transition hover:bg-white">
          Learn more
        </a>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#e3eadd] bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <a href="#" className="flex shrink-0 items-center gap-2.5">
              <Image src="/logotop.png" alt="Project Pulse" width={30} height={30} className="rounded-md" priority />
              <span className="whitespace-nowrap text-base font-bold tracking-tight text-[#123f2b] sm:text-lg">
                Project <span className="text-[#3f9f1a]">Pulse</span>
              </span>
            </a>

            <nav className="hidden items-center gap-6 text-sm font-semibold text-[#2b3a31] md:flex">
              {navLinks.map(([label, href]) => (
                <a key={href} href={href} className="transition hover:text-[#3f9f1a]">
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <a href="/login" className="hidden rounded-lg border border-[#123f2b] px-4 py-2 text-xs font-semibold text-[#123f2b] transition hover:bg-[#f3f8f4] sm:block sm:text-sm">
              Log in
            </a>
            <a href="/register" className="hidden whitespace-nowrap rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0f3324] sm:block sm:text-sm">
              Create Account
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close the menu" : "Open the menu"}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8d6] bg-white text-[#123f2b] transition hover:bg-[#f3f8f4] md:hidden"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[#e3eadd] bg-white px-4 pb-4 pt-2 md:hidden" aria-label="Menu">
            <ul className="text-sm font-semibold text-[#2b3a31]">
              {navLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 transition hover:bg-[#f3f8f4]">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
              <a href="/login" className="rounded-lg border border-[#123f2b] px-4 py-2.5 text-center text-sm font-semibold text-[#123f2b] transition hover:bg-[#f3f8f4]">
                Log in
              </a>
              <a href="/register" className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0f3324]">
                Create Account
              </a>
            </div>
          </nav>
        )}
      </header>

      <section className="relative z-10 mx-3 mt-3 overflow-hidden rounded-[28px] border border-[#e4e8e2] bg-[#f1f3f0] px-5 pb-16 pt-16 text-center sm:mx-5 lg:pb-20 lg:pt-24">
        <div className="relative z-10 mx-auto max-w-4xl">
          {/* The full title of the thesis paper, word for word (the user's decision, 2026-11-24). "Project Pulse" stays the product name in the top bar. */}
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-[1.15] tracking-tight text-[#123f2b] sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            A Unified Capstone Lifecycle Management and <span className="whitespace-nowrap">Stage-Based</span> Monitoring System
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#4d5751]">
            Streamlining your entire capstone journey from proposal to final archiving.
          </p>

          <div className="relative z-30 mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#123f2b] py-2 pl-2.5 pr-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(18,63,43,0.22)] transition hover:bg-[#0f3324]"
            >
              <Image src="/logotop.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg bg-white p-1" />
              Access Your Dashboard
            </a>
          </div>

          <p className="mt-5 text-xs text-[#7b877f]">Students sign up with their UB e-mail · Advisers and staff get their invitation by e-mail</p>
        </div>
      </section>

      <HeroShowcase />

      {/* Facts */}
      <section className="relative z-20 bg-white px-5 pb-10 pt-14 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold text-[#4d5751]">Made around how our department really works</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {[
              ["1–3", "students per group"],
              ["5", "defenses, in order"],
              ["6", "roles, own views"],
              ["Audit", "log of key actions"],
            ].map(([value, label]) => (
              <p key={label} className="flex items-baseline gap-2 text-[#8a948d]">
                <span className="text-xl font-extrabold tracking-tight text-[#6f7b73]">{value}</span>
                <span className="text-sm font-semibold">{label}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* See it in action */}
      <section id="about" className="scroll-mt-28 bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <Eyebrow>About Project Pulse</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight text-[#123f2b] md:text-5xl">Write together. Get feedback. Stay on track.</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#4d5751]">
              Project Pulse is where CICT capstone and thesis groups write their manuscript, hand in requirements, hear back from their adviser and book their defenses, so nothing gets lost on paper or in a group chat.
            </p>
          </div>
          <EditorPreview />
        </div>
      </section>

      {/* Journey */}
      <section id="workflow" className="scroll-mt-28 px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Eyebrow>The journey</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight text-[#123f2b] md:text-5xl">Six steps. We keep track of every one.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#4d5751]">Follows the way our department already works. Tap a step to see what happens and who is involved.</p>
          <Journey />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-28 bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Eyebrow>What you can do</Eyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-[#123f2b] md:text-5xl">Everything for your capstone, nothing you don&apos;t need.</h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-3xl border border-[#dfe8d6] p-7 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(18,63,43,0.12)] ${item.tone} ${index === 0 ? "lg:col-span-2" : ""} ${index === features.length - 1 ? "md:col-span-2 lg:col-span-3" : ""}`}
              >
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className={`mt-3 text-base leading-7 ${item.soft}`}>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-28 px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight text-[#123f2b] md:text-5xl">Everyone sees exactly what they need.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#4d5751]">Each person has their own dashboard and menu. Someone who is both an adviser and a panelist can switch profiles with one tap.</p>
          <Roles />
        </div>
      </section>

      {/* Getting started */}
      <section className="px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#e8ecdf] bg-white p-8 shadow-[0_24px_70px_rgba(23,28,25,0.07)] md:p-12">
          <Eyebrow>Getting started</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight text-[#123f2b] md:text-5xl">Ready in three steps.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {gettingStarted.map(([title, text], index) => (
              <div key={title} className="rounded-2xl border border-[#e3eadd] bg-white p-6">
                <p className="text-4xl font-extrabold text-[#4ac214]">{index + 1}</p>
                <h3 className="mt-3 text-lg font-bold text-[#123f2b]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4d5751]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/register" className="inline-flex rounded-full bg-[#123f2b] px-8 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0f3324]">
              Create your account
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight text-[#123f2b]">Quick answers</h2>
            <p className="mt-4 max-w-lg leading-8 text-[#4d5751]">Still stuck? Once you are in, the Feedback button at the top of every page goes straight to the Dean.</p>
          </div>
          <FAQAccordion />
        </div>
      </section>

      <footer className="border-t border-[#e8ecdf] bg-white px-5 py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Image src="/logotop.png" alt="Project Pulse" width={34} height={34} />
              <p className="font-bold">Project Pulse</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4d5751]">Capstone management for the College of Information and Communication Technology, University of Batangas.</p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="space-y-3">
              <p className="font-bold text-[#171c19]">Get in</p>
              <Link href="/login" className="block text-[#4d5751] hover:text-[#171c19]">Log in</Link>
              <Link href="/register" className="block text-[#4d5751] hover:text-[#171c19]">Create account</Link>
              <Link href="/forgot-password" className="block text-[#4d5751] hover:text-[#171c19]">Forgot password</Link>
            </div>
            <div className="space-y-3">
              <p className="font-bold text-[#171c19]">Legal</p>
              <Link href="/terms" className="block text-[#4d5751] hover:text-[#171c19]">Terms</Link>
              <Link href="/privacy" className="block text-[#4d5751] hover:text-[#171c19]">Privacy</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-[#e8ecdf] pt-6 text-sm text-[#4d5751]">© 2026 Project Pulse · College of Information and Communication Technology</div>
      </footer>
    </main>
  );
}
