import type { ReactNode } from "react";

// The title of a dashboard card, on a dark green strip with white text (the user's choice, 2026-11-25: it was pastel before, now the same dark green as the hero cards).
// `tone` is kept so existing screens still compile, but every tone is now the same dark green. It sits flush with the top edge of a card that has `p-5`.
const TINTS = {
  mint: "bg-[#154530]",
  lime: "bg-[#154530]",
  aqua: "bg-[#154530]",
} as const;

export type CardTone = keyof typeof TINTS;

export default function CardHeading({ title, tone = "mint", right }: { title: ReactNode; tone?: CardTone; right?: ReactNode }) {
  return (
    <div className={`-mx-5 -mt-5 mb-4 flex items-baseline justify-between gap-3 rounded-t-2xl px-5 py-3 ${TINTS[tone]}`}>
      <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
      {right}
    </div>
  );
}
