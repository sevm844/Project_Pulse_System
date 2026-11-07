import Link from "next/link";

// Passwords are reset by the Dean (Administration > Users > Reset password); there is no email-based reset.
export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8faf7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#edf2ec] bg-white p-8 shadow-[0_24px_80px_rgba(31,42,36,0.08)]">
        <h1 className="text-xl font-semibold text-[#203028]">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-[#59645d]">
          Passwords are reset by the Dean&apos;s office. Contact the Dean or your Research Coordinator and ask for a new
          password. They will give you a temporary one you can use to sign in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
