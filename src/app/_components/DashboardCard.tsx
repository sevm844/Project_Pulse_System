import type { CSSProperties, ReactNode } from "react";

// The solid white card every dashboard is built from (the same one the student dashboard uses).
export default function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#dfe8df] bg-white shadow-[0_16px_42px_rgba(31,42,36,0.07)] ${className}`}>{children}</div>
  );
}

// One colour for every role (a deep school green), so the whole system looks the same. Do not add a colour per role.
export type HeroTone = "green";

const TONES: Record<HeroTone, { card: string; shapeA: string; shapeB: string; eyebrow: string }> = {
  green: { card: "border-[#0f3324] bg-[#154530]", shapeA: "bg-[#1c5539]", shapeB: "bg-[#c9a227]/20", eyebrow: "text-[#a6dfb0]" },
};

// Text on the dark card.
export const heroTitleClass = "mt-2 text-3xl font-semibold tracking-tight text-white";
export const heroTextClass = "mt-2 max-w-2xl text-sm leading-6 text-white/75";

// "Good morning", "Good afternoon" or "Good evening" by the Manila clock.
export function greetingFor(now = Date.now()) {
  const hour = Number(new Date(now).toLocaleString("en-US", { timeZone: "Asia/Manila", hour: "numeric", hour12: false })) % 24;

  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

// The coloured top card of a dashboard. Nothing in it is clickable unless the page puts a real link or button there.
export function HeroCard({ tone = "green", className = "", children }: { tone?: HeroTone; className?: string; children: ReactNode }) {
  const t = TONES[tone];

  return (
    <section className={`relative overflow-hidden rounded-2xl border shadow-[0_16px_42px_rgba(31,42,36,0.08)] ${t.card} ${className}`}>
      {/* a few soft shapes, like cut paper */}
      <span aria-hidden className={`pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full ${t.shapeA}`} />
      <span aria-hidden className={`pointer-events-none absolute -bottom-24 right-1/4 h-52 w-52 rounded-full ${t.shapeB}`} />
      <div className="relative">{children}</div>
    </section>
  );
}

export function heroEyebrowClass(tone: HeroTone = "green") {
  return `text-sm font-semibold ${TONES[tone].eyebrow}`;
}

// The top card of a dashboard: who and what this page is, then a row of the numbers that matter.
export function DashboardHeader({
  eyebrow,
  title,
  text,
  stats,
  tone = "green",
}: {
  eyebrow: string;
  title: string;
  text: string;
  stats: { label: string; value: string | number }[];
  tone?: HeroTone;
}) {
  return (
    <HeroCard tone={tone}>
      <div className="p-6 sm:p-7">
        <p className={heroEyebrowClass(tone)}>{eyebrow}</p>
        <h1 className={heroTitleClass}>{title}</h1>
        <p className={heroTextClass}>{text}</p>
      </div>

      <div
        className="mx-4 mb-4 grid divide-y divide-[#edf2ec] overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_8px_24px_rgba(31,42,36,0.08)] md:divide-x md:divide-y-0 md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ "--n": stats.length } as CSSProperties}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="p-4">
            <p className="text-xs font-medium text-[#7b877f]">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#203028]">{stat.value}</p>
          </div>
        ))}
      </div>
    </HeroCard>
  );
}
