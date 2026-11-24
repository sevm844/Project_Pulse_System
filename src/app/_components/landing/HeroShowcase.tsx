"use client";

import { useState, type ReactNode } from "react";

// The large rounded panel under the hero text (the user's choice, 2026-11-24, inspired by a scheduling site): four round tabs, and a white card that shows one
// part of the system with a small preview. Only the system's greens and white are used. The tabs are real buttons; everything in the previews is just a picture.

type Tab = { key: string; label: string; heading: string; text: string; icon: ReactNode; preview: ReactNode };

const iconProps = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const GroupsPreview = () => (
  <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(18,63,43,0.1)]">
    <p className="text-sm font-bold text-[#123f2b]">Team Alpha</p>
    <p className="text-[11px] text-[#7b877f]">BSIT 4A · Adviser: Prof. Santos</p>
    <div className="mt-3 space-y-2">
      {[["AB", "Ana Reyes", "Leader"], ["BC", "Ben Cruz", "Member"], ["CD", "Carla Diaz", "Member"]].map(([initials, name, role]) => (
        <div key={name} className="flex items-center gap-3 rounded-xl bg-[#f3f8f4] px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7f7d8] text-[11px] font-bold text-[#123f2b]">{initials}</span>
          <span className="flex-1 text-xs font-semibold text-[#203028]">{name}</span>
          <span className="text-[11px] text-[#7b877f]">{role}</span>
        </div>
      ))}
    </div>
    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-[#59645d]">
      <span className="h-2.5 w-2.5 rounded-full bg-[#3a7f35]" /> Title Proposal
      <span className="h-px flex-1 bg-[#cfe0d3]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#3a7f35]" /> Consultation
      <span className="h-px flex-1 bg-[#cfe0d3]" />
      <span className="h-2.5 w-2.5 rounded-full border border-[#9fb5a4] bg-white" /> Defense
    </div>
  </div>
);

const DefensesPreview = () => (
  <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(18,63,43,0.1)]">
    <p className="text-sm font-bold text-[#123f2b]">Defense schedule</p>
    <p className="text-[11px] text-[#7b877f]">Philippine time</p>
    <div className="mt-3 space-y-2">
      {[
        ["8:00 AM", "Proposal Defense", "Room 301 · 3 panelists", true],
        ["9:00 AM", "Alpha Defense", "Room 301 · 3 panelists", false],
        ["10:30 AM", "Beta Defense", "Room 204 · 3 panelists", false],
      ].map(([time, title, where, first]) => (
        <div key={String(title)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${first ? "bg-[#123f2b] text-white" : "bg-[#f3f8f4] text-[#203028]"}`}>
          <span className="w-16 text-xs font-bold">{String(time)}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">{String(title)}</span>
            <span className={`block text-[10px] ${first ? "text-white/75" : "text-[#7b877f]"}`}>{String(where)}</span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ManuscriptPreview = () => (
  <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(18,63,43,0.1)]">
    <p className="text-sm font-bold text-[#123f2b]">Version 2 · Chapter 1</p>
    <div className="mt-3 space-y-1.5">
      <span className="block h-2 w-11/12 rounded bg-[#e3eadd]" />
      <span className="block h-2 w-full rounded bg-[#e3eadd]" />
      <span className="block h-2 w-10/12 rounded bg-[#a8e87a]/70" />
      <span className="block h-2 w-full rounded bg-[#e3eadd]" />
      <span className="block h-2 w-7/12 rounded bg-[#e3eadd]" />
    </div>
    <div className="mt-4 rounded-xl bg-[#f3f8f4] p-3">
      <p className="text-[11px] font-bold text-[#123f2b]">Technical adviser</p>
      <p className="mt-1 text-[11px] leading-4 text-[#59645d]">Make this objective measurable, then submit a new version.</p>
    </div>
  </div>
);

const RecordsPreview = () => (
  <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(18,63,43,0.1)]">
    <p className="text-sm font-bold text-[#123f2b]">Final records</p>
    <div className="mt-3 space-y-2">
      {["Final manuscript received", "Poster received", "Certificate of editing", "Project archived"].map((item, index) => (
        <div key={item} className="flex items-center gap-3 rounded-xl bg-[#f3f8f4] px-3 py-2">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${index < 3 ? "bg-[#3a7f35] text-white" : "border border-[#9fb5a4] bg-white text-transparent"}`}>✓</span>
          <span className="text-xs font-semibold text-[#203028]">{item}</span>
        </div>
      ))}
    </div>
  </div>
);

const TABS: Tab[] = [
  {
    key: "groups",
    label: "Groups",
    heading: "Form your group and meet your adviser",
    text: "Your adviser forms your group of up to three. Propose your titles, get a decision and move step by step to your Proposal Defense.",
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M17 14.2c2.4 0 4 1.7 4 4.3" />
      </svg>
    ),
    preview: <GroupsPreview />,
  },
  {
    key: "defenses",
    label: "Defenses",
    heading: "Know your defense schedule",
    text: "Five defenses in order, from Proposal to Final. The room, the time and the panel are set for you, and you are reminded by e-mail.",
    icon: (
      <svg {...iconProps}>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </svg>
    ),
    preview: <DefensesPreview />,
  },
  {
    key: "manuscripts",
    label: "Manuscripts",
    heading: "Write together and get feedback",
    text: "Write your manuscript with your group, submit a version, and read your advisers' comments on the exact words.",
    icon: (
      <svg {...iconProps}>
        <path d="M7 3.5h7l4.5 4.5v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" />
        <path d="M14 3.5V8h4.5M8.5 13h7M8.5 16.5h5" />
      </svg>
    ),
    preview: <ManuscriptPreview />,
  },
  {
    key: "records",
    label: "Records",
    heading: "Everything kept and archived",
    text: "Final outputs, certificates and the archive are kept by the Dean's Secretary, so nothing is lost when your capstone ends.",
    icon: (
      <svg {...iconProps}>
        <path d="M3.5 7.5h17v3h-17zM5 10.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-8.5" />
        <path d="M10 14h4" />
      </svg>
    ),
    preview: <RecordsPreview />,
  },
];

export default function HeroShowcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div
      className="mx-4 mt-6 rounded-[28px] px-4 pb-8 pt-6 sm:mx-auto sm:max-w-4xl sm:px-10 sm:pb-12 sm:pt-8"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 38% 48% at 82% 14%, rgba(190,236,120,0.95) 0%, rgba(190,236,120,0) 100%), radial-gradient(ellipse 36% 50% at 14% 38%, rgba(150,232,176,0.9) 0%, rgba(150,232,176,0) 100%), radial-gradient(ellipse 40% 45% at 22% 96%, rgba(166,226,226,0.95) 0%, rgba(166,226,226,0) 100%), radial-gradient(ellipse 36% 42% at 86% 92%, rgba(120,210,170,0.85) 0%, rgba(120,210,170,0) 100%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(230,250,238,0.9) 0%, rgba(230,250,238,0) 100%), linear-gradient(135deg, #cdeedd 0%, #c3ebd2 50%, #cfeed6 100%)",
      }}
    >
      <div role="tablist" aria-label="What Project Pulse covers" className="flex items-center justify-center gap-3">
        {TABS.map((item, index) => (
          <div key={item.key} className="relative">
            <button
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={item.label}
              title={item.label}
              onClick={() => setActive(index)}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                index === active ? "border-[#123f2b] bg-[#123f2b] text-white shadow-[0_8px_22px_rgba(18,63,43,0.35)]" : "border-white/70 bg-white/55 text-[#2f6b3c] hover:bg-white/80"
              }`}
            >
              {item.icon}
            </button>
            {index === active && <span aria-hidden className="absolute left-1/2 top-full h-4 w-6 -translate-x-1/2 bg-[#fcfdfc]" />}
          </div>
        ))}
      </div>

      <div className="mt-4 grid items-center gap-8 rounded-3xl bg-[#fcfdfc] p-6 shadow-[0_24px_60px_rgba(18,63,43,0.16)] md:grid-cols-2 md:p-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[#123f2b]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d7f7d8] text-[#123f2b] [&>svg]:h-4 [&>svg]:w-4">{tab.icon}</span>
            {tab.label}
          </p>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-[#123f2b] md:text-4xl">{tab.heading}</h2>
          <p className="mt-4 text-sm leading-7 text-[#59645d]">{tab.text}</p>
          <a href="#features" className="mt-6 inline-block border-b border-[#123f2b] pb-0.5 text-sm font-semibold text-[#123f2b] hover:text-[#3a7f35]">
            Learn more →
          </a>
        </div>

        <div className="rounded-2xl bg-[#e8f6ee] p-5 sm:p-7">{tab.preview}</div>
      </div>
    </div>
  );
}
