import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// The layout of the password pages: the same single balanced card as the login page (CICT panel on the left, the form on the right,
// both centred at the same height). Only the words on the left differ.
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f4fbf5] via-[#e8f6ea] to-[#d3eed9] p-4 sm:p-6">
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(31,60,40,0.18)] lg:grid-cols-2">
        <aside className="hidden flex-col items-center justify-center bg-gradient-to-b from-[#f4fbf5] via-[#e8f6ea] to-[#d3eed9] px-10 py-12 text-center lg:flex">
          <div className="relative flex h-[250px] w-[250px] items-center justify-center">
            <div aria-hidden="true" className="absolute inset-0 rounded-full border border-[#164832]/10" />
            <div aria-hidden="true" className="absolute inset-[9%] rounded-full bg-white/70 shadow-[0_0_70px_rgba(47,143,78,0.25)]" />
            <Image
              src="/cict-logo.png"
              alt="College of Information and Communications Technology, University of Batangas"
              width={200}
              height={200}
              priority
              className="relative z-10 h-[200px] w-[200px] drop-shadow-[0_12px_24px_rgba(22,72,50,0.25)]"
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Image src="/logo-icon-clear.png" alt="" width={34} height={34} priority />
            <span className="text-2xl font-semibold text-[#123f2b]">
              Project <span className="text-green-600">Pulse</span>
            </span>
          </div>
          <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight text-[#123f2b]">Only you know your password.</h2>
          <p className="mt-2 max-w-[18rem] text-balance text-sm leading-6 text-[#123f2b]/70">It is never shown to the Dean, your adviser or anyone else.</p>
        </aside>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-sm">
            <Link href={backHref} className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">
              ← Back to login
            </Link>

            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <Image src="/cict-logo.png" alt="College of Information and Communications Technology" width={36} height={36} />
              <Image src="/logo-icon-clear.png" alt="" width={36} height={36} />
              <span className="text-lg font-semibold">
                Project <span className="text-green-600">Pulse</span>
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-base text-gray-400">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
