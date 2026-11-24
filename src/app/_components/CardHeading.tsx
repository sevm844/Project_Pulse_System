import type { ReactNode } from "react";

// The title of a dashboard card, on a soft pastel strip (the user's idea, 2026-11-24: not plain white all the way down, but still clean and minimal).
// Only pale greens: mint, lime, aqua-green. It sits flush with the top edge of a card that has `p-5`.
const TINTS = {
  mint: "bg-[#e3f6ec]",
  lime: "bg-[#eaf7d6]",
  aqua: "bg-[#e0f3f0]",
} as const;

export type CardTone = keyof typeof TINTS;

export default function CardHeading({ title, tone = "mint", right }: { title: ReactNode; tone?: CardTone; right?: ReactNode }) {
  return (
    <div className={`-mx-5 -mt-5 mb-4 flex items-baseline justify-between gap-3 rounded-t-2xl px-5 py-3 ${TINTS[tone]}`}>
      <h2 className="text-base font-semibold tracking-tight text-[#123f2b]">{title}</h2>
      {right}
    </div>
  );
}
