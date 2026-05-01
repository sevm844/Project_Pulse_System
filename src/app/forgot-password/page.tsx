"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const passwordChecks = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
  }, [newPassword]);

  const strength = useMemo(() => {
    const passed = Object.values(passwordChecks).filter(Boolean).length;

    if (!newPassword) return "Empty";
    if (passed <= 1) return "Weak";
    if (passed === 2) return "Medium";
    return "Strong";
  }, [newPassword, passwordChecks]);

  function handleRequestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    setMessage("");
    setStep("reset");
  }

  function handleCreatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.special) {
      setMessage("Please complete all password requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setMessage("Password updated successfully. You can now log in.");
  }

  return (
    <main className="grid min-h-screen bg-white text-[#111111] lg:grid-cols-[0.95fr_1.05fr]">
      {/* Form side */}
      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="mb-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f1f1] text-xl text-[#111111] transition hover:bg-[#e8e8e8]"
          >
            ←
          </Link>

          {step === "email" ? (
            <>
              <h1 className="text-4xl font-semibold tracking-tight">
                Forgot password?
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#777777]">
                Enter your account email and continue to reset your password.
              </p>

              <form onSubmit={handleRequestReset} className="mt-10 space-y-5">
                <div>
                  <label className="text-sm font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your UB email"
                    className="mt-2 w-full rounded-xl border border-[#dddddd] px-4 py-3 text-sm outline-none transition focus:border-[#111111] focus:ring-4 focus:ring-black/5"
                  />
                </div>

                {message && (
                  <p className="rounded-xl bg-[#f6f6f6] px-4 py-3 text-sm text-[#555555]">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#111111] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                >
                  Continue
                </button>

                <p className="text-center text-xs text-[#555555]">
                  Remembered it?{" "}
                  <Link href="/login" className="font-semibold underline">
                    Login
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-semibold tracking-tight">
                Set a new password
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#777777]">
                Create a strong password to keep your account safe and secure.
              </p>

              <form onSubmit={handleCreatePassword} className="mt-10 space-y-5">
                <div>
                  <label className="text-sm font-semibold">New Password</label>
                  <div className="mt-2 flex items-center rounded-xl border border-[#cfcfcf] px-4 py-3 focus-within:border-[#111111] focus-within:ring-4 focus-within:ring-black/5">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="min-w-0 flex-1 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-xs font-semibold text-[#777777]"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f1f1f1] p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${
                        strength === "Strong"
                          ? "bg-emerald-500"
                          : strength === "Medium"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    >
                      !
                    </span>
                    <p className="text-sm font-semibold">
                      {strength === "Empty" ? "Weak" : strength}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div
                      className={`h-1 rounded-full ${
                        newPassword ? "bg-red-400" : "bg-[#d9d9d9]"
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full ${
                        strength === "Medium" || strength === "Strong"
                          ? "bg-amber-400"
                          : "bg-[#d9d9d9]"
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full ${
                        strength === "Strong" ? "bg-emerald-500" : "bg-[#d9d9d9]"
                      }`}
                    />
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <PasswordCheck
                      passed={passwordChecks.length}
                      label="Be at least 8 characters long"
                    />
                    <PasswordCheck
                      passed={passwordChecks.uppercase}
                      label="At least one uppercase letter (A-Z)"
                    />
                    <PasswordCheck
                      passed={passwordChecks.special}
                      label="At least one special character (!@#$%^&*)"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Confirm New Password
                  </label>
                  <div className="mt-2 flex items-center rounded-xl border border-[#dddddd] px-4 py-3 focus-within:border-[#111111] focus-within:ring-4 focus-within:ring-black/5">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="min-w-0 flex-1 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-xs font-semibold text-[#777777]"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {message && (
                  <p className="rounded-xl bg-[#f6f6f6] px-4 py-3 text-sm text-[#555555]">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#111111] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                >
                  Create New Password
                </button>

                <p className="text-center text-xs text-[#555555]">
                  Remembered it?{" "}
                  <Link href="/login" className="font-semibold underline">
                    Login
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Visual side */}
<section className="relative hidden min-h-screen overflow-hidden bg-[#101711] p-8 lg:block">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(148,210,154,0.35),rgba(16,23,17,0)_34%),radial-gradient(circle_at_70%_85%,rgba(210,255,158,0.24),rgba(16,23,17,0)_38%)]" />
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-[0.08] [background-size:22px_22px]" />

  <div className="relative z-10 flex h-full flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.06] p-10 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
    <div>
      <p className="text-sm font-semibold text-[#94d29a]">Project Pulse</p>
      <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-tight text-white">
        Secure access for every capstone role.
      </h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
        Password recovery helps protect student submissions, adviser reviews,
        defense records, and final approval workflows.
      </p>
    </div>

    <div className="grid gap-3">
      {[
        "Role-based dashboard access",
        "Protected manuscript and revision records",
        "Centralized capstone monitoring",
      ].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 text-sm font-medium text-white/80"
        >
          {item}
        </div>
      ))}
    </div>
  </div>
</section>

    </main>
  );
}

function PasswordCheck({
  passed,
  label,
}: {
  passed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
          passed
            ? "bg-white text-emerald-600"
            : "bg-white text-[#999999]"
        }`}
      >
        {passed ? "✓" : "×"}
      </span>
      <span className={passed ? "text-[#222222]" : "text-[#777777]"}>
        {label}
      </span>
    </div>
  );
}
