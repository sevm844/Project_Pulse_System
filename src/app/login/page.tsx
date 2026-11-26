"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { roleHomePath } from "../_lib/roleHome";
import PasswordEye from "../_components/PasswordEye";
import { ApiError, apiFetch, logoutFromApi, toAppRole } from "../_lib/api";
import {
  getStoredToken,
  getStoredUserName,
  getStoredUserRole,
  saveStoredToken,
  saveStoredUserSession,
} from "../_utils/authStorage";

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

  // Someone who pressed the browser's Back button lands here while still signed in. Say so, and let them choose.
  const [signedIn, setSignedIn] = useState<{ name: string; home: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // The automatic sign out after a long time with no activity sends people here with ?expired=1.
    if (new URLSearchParams(window.location.search).get("expired")) queueMicrotask(() => setExpired(true));

    const role = getStoredUserRole();

    if (getStoredToken() && role) {
      queueMicrotask(() => setSignedIn({ name: getStoredUserName() ?? "your account", home: roleHomePath(role) }));
    }
  }, []);

  async function handleLogoutHere() {
    setLoggingOut(true);
    await logoutFromApi();
    setSignedIn(null);
    setLoggingOut(false);
  }

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f4fbf5] via-[#e8f6ea] to-[#d3eed9] p-4 sm:p-6">
      {/* One balanced card: the CICT panel on the left and the form on the right, both centred at the same height. */}
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(31,60,40,0.18)] lg:grid-cols-2">
        <aside className="hidden flex-col items-center justify-center bg-gradient-to-b from-[#f4fbf5] via-[#e8f6ea] to-[#d3eed9] px-10 py-12 text-center lg:flex">
          <div className="relative flex h-[290px] w-[290px] items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-[4%] rounded-full bg-[radial-gradient(circle,rgba(47,143,78,0.16),transparent_68%)]"
            />
            <Image
              src="/cict-logo.png"
              alt="College of Information and Communications Technology, University of Batangas"
              width={230}
              height={230}
              priority
              className="relative z-10 h-[230px] w-[230px]"
            />
          </div>

          <div className="mt-7 flex items-center gap-3">
            <Image
              src="/logo-icon-clear.png"
              alt=""
              width={34}
              height={34}
              priority
            />
            <span className="text-2xl font-semibold text-[#123f2b]">
              Project <span className="text-green-600">Pulse</span>
            </span>
          </div>
          <p className="mt-2 max-w-[18rem] text-balance text-sm leading-6 text-[#123f2b]/70">
            Your capstone, from first title to final defense.
          </p>
        </aside>

        {/* Right: the form in a centred white card. */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-sm">
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

            {signedIn ? (
              <div role="status">
                <h1 className="text-3xl font-bold tracking-tight">You are still signed in</h1>
                <p className="mt-2 text-base text-gray-500">
                  You are signed in as <span className="font-semibold text-[#123f2b]">{signedIn.name}</span>. Do you want to go back to your dashboard, or log out?
                </p>
                <div className="mt-7 space-y-3">
                  <Link
                    href={signedIn.home}
                    className="block w-full rounded-xl bg-gradient-to-r from-[#123f2b] to-[#2f8f4e] py-3.5 text-center text-base font-semibold text-white shadow-[0_12px_28px_rgba(47,143,78,0.35)] transition hover:brightness-110"
                  >
                    Back to my dashboard
                  </Link>
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={() => void handleLogoutHere()}
                    className="w-full rounded-xl border border-[#e3e8e3] bg-white py-3.5 text-base font-semibold text-[#203028] transition hover:bg-[#f7f9f7] disabled:opacity-60"
                  >
                    {loggingOut ? "Logging out..." : "Log out"}
                  </button>
                </div>
              </div>
            ) : (
              <>
            <h1 className="text-3xl font-bold tracking-tight">Log in</h1>
            <p className="mt-2 text-base text-gray-400">
              Sign in using your UB account.
            </p>

            {expired && !signedIn && (
              <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                You were logged out because the page was left alone for a while. Please sign in again.
              </div>
            )}

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
                  autoComplete="username"
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
                    autoComplete="current-password"
                    placeholder="Your password"
                    className={`${input} pr-11`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <PasswordEye shown={showPassword} onClick={() => setShowPassword(!showPassword)} />
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
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
