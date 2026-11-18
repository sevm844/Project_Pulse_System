import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// The layout of the password pages: the same full-screen look as the login page (soft green side with the words, white side with the form).
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
    <main className="min-h-screen bg-white text-gray-900 lg:grid lg:h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-[#f4fbf5] via-[#e8f6ea] to-[#d3eed9] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="flex items-center gap-4">
          <Image src="/cict-logo.png" alt="College of Information and Communications Technology" width={72} height={72} priority />
          <Image src="/logo-icon-clear.png" alt="" width={72} height={72} priority />
          <span className="text-3xl font-semibold text-[#123f2b]">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

        <Image src="/cict-logo.png" alt="" width={420} height={420} aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-24 opacity-[0.13] saturate-50" />

        <div className="relative">
          <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#123f2b] xl:text-5xl">
            Only you
            <br />
            know your
            <br />
            password.
          </h2>
          <p className="mt-3 max-w-sm bg-gradient-to-r from-[#2f8f4e] to-[#0f7a6b] bg-clip-text text-base font-medium text-transparent">
            It is never shown to the Dean, your adviser or anyone else.
          </p>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col justify-center overflow-y-auto px-8 py-6 sm:px-14 lg:min-h-0 xl:px-24">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <Link href={backHref} className="mb-3 inline-block text-sm text-gray-500 hover:text-gray-900">
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
          <div className="mt-5">{children}</div>
        </div>
      </section>
    </main>
  );
}
