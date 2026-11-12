import type { CSSProperties, ReactNode } from "react";

// The solid white card every dashboard is built from (the same one the student dashboard uses).
export default function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#dfe8df] bg-white shadow-[0_16px_42px_rgba(31,42,36,0.07)] ${className}`}>{children}</div>
  );
}

// The top card of a dashboard: who and what this page is, then a row of the numbers that matter.
export function DashboardHeader({
  eyebrow,
  title,
  text,
  stats,
}: {
  eyebrow: string;
  title: string;
  text: string;
  stats: { label: string; value: string | number }[];
}) {
  return (
    <DashboardCard className="overflow-hidden">
      <div className="border-b border-[#edf2ec] bg-[#fbfdfb] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f8f58]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#203028]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59645d]">{text}</p>
      </div>

      <div
        className="grid divide-y divide-[#edf2ec] bg-white md:divide-x md:divide-y-0 md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ "--n": stats.length } as CSSProperties}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="p-5">
            <p className="text-xs font-medium text-[#7b877f]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#203028]">{stat.value}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
