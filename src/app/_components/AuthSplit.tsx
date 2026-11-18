import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// The layout of the password pages: the same soft background and centred card as the login page.
export default function AuthSplit({
  title,
  subtitle,
  backHref = "/login",
  children,
}: {
  title: string;
  subtitle: string;
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9f9ff] px-6 py-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(207,247,236,0.32),rgba(249,249,255,0)_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3eb_1px,transparent_1px)] opacity-45 [background-size:24px_24px]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/72 p-8 shadow-[0_24px_70px_rgba(31,42,36,0.12)] backdrop-blur-2xl">
        <Link href={backHref} aria-label="Back to login" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f1] text-lg text-[#203028] hover:bg-[#e5eae5]">
          ←
        </Link>

        <div className="mb-6 mt-2 flex items-center justify-center gap-3">
          <Image src="/cict-logo.png" alt="College of Information and Communications Technology" width={34} height={34} />
          <Image src="/Logo-icon.png" alt="" width={34} height={34} />
          <span className="text-lg font-semibold">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

        <h1 className="text-center text-2xl font-semibold text-[#111]">{title}</h1>
        <p className="mt-1 text-center text-sm text-gray-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
