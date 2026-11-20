"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { roleHomePath } from "../_lib/roleHome";
import { ApiError, apiFetch, toAppRole } from "../_lib/api";
import { saveStoredToken, saveStoredUserSession } from "../_utils/authStorage";

type LoginResponse = {
  token: string;
  user: {
    user_id: number;
    fname: string;
    lname: string;
    email: string;
    role: string;
    roles?: string[];
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const result = await apiFetch<LoginResponse>("/login", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const role = toAppRole(result.user.role);
      const uid = String(result.user.user_id);

      saveStoredToken(result.token);
      saveStoredUserSession({
        uid,
        email: result.user.email,
        role,
        roles: (result.user.roles ?? [result.user.role]).map(toAppRole),
        name: `${result.user.fname} ${result.user.lname}`.trim(),
      });

      router.push(roleHomePath(role));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to log in. Please try again.",
      );
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl border border-[#e3e8e3] bg-[#f7f9f7] px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f4fbf5] via-[#e8f6ea] to-[#d3eed9]">
      <div className="relative z-10 grid min-h-screen w-full lg:h-screen lg:min-h-0 lg:grid-cols-2">
        {/* Left: our two logos, a faint CICT mark in the middle and the words. The green gradient is the page's own background, so there is no split. */}
        <aside className="relative hidden flex-col items-center justify-center overflow-hidden p-12 text-center lg:flex xl:p-16">
          {/* The small brand, top left. */}
          <div className="absolute left-12 top-10 flex items-center gap-3 xl:left-16">
            <Image src="/logo-icon-clear.png" alt="" width={40} height={40} priority />
            <span className="text-xl font-semibold text-[#123f2b]">
              Project <span className="text-green-600">Pulse</span>
            </span>
          </div>

          {/* The CICT logo is the hero: big, in colour, inside soft orbit rings and a glow. */}
          <div className="relative flex h-[440px] w-[440px] items-center justify-center xl:h-[500px] xl:w-[500px]">
            <div aria-hidden="true" className="absolute inset-0 rounded-full border border-[#164832]/10" />
            <div aria-hidden="true" className="absolute inset-[11%] rounded-full border border-[#164832]/10" />
            <div aria-hidden="true" className="absolute inset-[22%] rounded-full bg-white/60 shadow-[0_0_90px_rgba(47,143,78,0.28)]" />
            <Image
              src="/cict-logo.png"
              alt="College of Information and Communications Technology, University of Batangas"
              width={300}
              height={300}
              priority
              className="relative z-10 h-[270px] w-[270px] drop-shadow-[0_14px_30px_rgba(22,72,50,0.25)] xl:h-[310px] xl:w-[310px]"
            />
          </div>

          <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-[#123f2b] xl:text-4xl">
            Your capstone,
            <br />
            from first title to final defense.
          </h2>
          <p className="mt-3 bg-gradient-to-r from-[#2f8f4e] to-[#0f7a6b] bg-clip-text text-base font-medium text-transparent">
            Know where your group stands.
          </p>
        </aside>

        {/* Right: the form in a centred white card. */}
        <section className="flex items-center justify-center overflow-y-auto px-6 py-8">
          <div className="w-full max-w-md rounded-3xl bg-white px-8 py-9 shadow-[0_24px_70px_rgba(31,60,40,0.16)] sm:px-10">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <Image
                src="/cict-logo.png"
                alt="College of Information and Communications Technology"
                width={36}
                height={36}
              />
              <Image src="/logo-icon-clear.png" alt="" width={36} height={36} />
              <span className="text-lg font-semibold">
                Project <span className="text-green-600">Pulse</span>
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">Log in</h1>
            <p className="mt-2 text-base text-gray-400">
              Sign in using your approved UB account.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="1234567@ub.edu.ph"
                  className={input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    className={`${input} pr-16`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-green-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#123f2b] to-[#2f8f4e] py-3.5 text-base font-semibold text-white shadow-[0_12px_28px_rgba(47,143,78,0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-green-600 hover:underline"
              >
                Create Account
              </Link>
            </p>
            <p className="mt-2 text-center text-xs text-gray-400">
              <Link href="/terms" className="hover:underline">
                Terms and Conditions
              </Link>
              {" · "}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
