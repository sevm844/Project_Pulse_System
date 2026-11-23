import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import LegalFooter from "./LegalFooter";

// The layout of the Terms and the Privacy Policy: the login page's background, one compact card that fits a laptop screen,
// and the points as small cards in a grid (it stacks and scrolls only on a phone).
export default function LegalPage({
  title,
  updated,
  intro,
  other,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  other: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9f9ff] px-6 py-6 text-[#203028] lg:h-screen lg:min-h-0">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(207,247,236,0.32),rgba(249,249,255,0)_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3eb_1px,transparent_1px)] opacity-45 [background-size:24px_24px]" />

      <div className="relative z-10 w-full max-w-5xl rounded-2xl border border-white/60 bg-white/72 p-7 shadow-[0_24px_70px_rgba(31,42,36,0.12)] backdrop-blur-2xl">
        <div className="flex items-center justify-center gap-3">
          <Image src="/cict-logo.png" alt="College of Information and Communications Technology" width={34} height={34} />
          <Image src="/logo-icon-clear.png" alt="" width={34} height={34} />
          <span className="text-lg font-semibold">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

        <h1 className="mt-3 text-center text-2xl font-semibold text-[#111]">{title}</h1>
        <p className="mx-auto mt-1 max-w-3xl text-center text-sm leading-6 text-gray-500">{intro}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{children}</div>

        <Suspense
          fallback={<p className="mt-5 text-center text-xs text-gray-500">Last updated {updated}</p>}
        >
          <LegalFooter updated={updated} other={other} />
        </Suspense>
      </div>
    </main>
  );
}

export function Point({ n, heading, children }: { n: number; heading: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#dfe8df] bg-white/85 p-4">
      <h2 className="flex items-baseline gap-2 text-sm font-semibold text-[#111]">
        <span className="text-green-600">{String(n).padStart(2, "0")}</span>
        {heading}
      </h2>
      <div className="mt-1.5 space-y-1 text-[13px] leading-5 text-[#4d5751]">{children}</div>
    </section>
  );
}
