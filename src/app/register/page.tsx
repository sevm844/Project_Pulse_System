"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../_lib/api";
import PasswordStrength from "../_components/PasswordStrength";
import { passwordIsStrong } from "../_lib/password";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidStudentEmail(value: string) {
    return /^\d{7}@ub\.edu\.ph$/.test(value.toLowerCase());
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const normalizedName = fullName.trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    const nameParts = normalizedName.split(/\s+/);

    if (nameParts.length < 2) {
      setError("Please enter your first and last name.");
      return;
    }

    if (!isValidStudentEmail(normalizedEmail)) {
      setError("Please enter a valid UB student email.");
      return;
    }

    if (!passwordIsStrong(password)) {
      setError("Your password does not follow all the rules yet.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms and Conditions and the Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const lname = nameParts[nameParts.length - 1];
      const fname = nameParts.slice(0, -1).join(" ");

      await apiFetch<{ message: string; user_id: number }>(
        "/register",
        {
          method: "POST",
          body: JSON.stringify({
            fname,
            lname,
            email: normalizedEmail,
            password,
            accept_terms: true,
          }),
        },
      );

      setSuccess(
        "Account created. It is now waiting for approval by the Research Coordinator. You can log in once it is approved. Redirecting to login...",
      );

      setTimeout(() => {
        window.location.href = "/login";
      }, 3500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create account. Please try again.",
      );
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9f9ff] px-6 py-6 text-gray-900 lg:h-screen lg:min-h-0">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(207,247,236,0.32),rgba(249,249,255,0)_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3eb_1px,transparent_1px)] opacity-45 [background-size:24px_24px]" />

      <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/60 bg-white/72 p-8 shadow-[0_24px_70px_rgba(31,42,36,0.12)] backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Image src="/cict-logo.png" alt="College of Information and Communications Technology" width={34} height={34} />
          <Image src="/Logo-icon.png" alt="" width={34} height={34} />
          <span className="text-lg font-semibold">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

        <h2 className="text-center text-2xl font-semibold">Create Account</h2>
        <p className="mt-1 text-center text-sm text-gray-500">Register using your UB student email.</p>

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
        {success && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">{success}</div>}

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                <input type="text" placeholder="Juan Dela Cruz" className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Student Email</label>
                <input type="email" placeholder="1234567@ub.edu.ph" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <input type="password" placeholder="Password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
              <PasswordStrength password={password} />
              <div>
                <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
                <input type="password" placeholder="Confirm password" className={input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 text-sm text-gray-600">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#123f2b]" />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium text-gray-900 underline">
                Terms and Conditions
              </Link>{" "}
              and the{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-gray-900 underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button type="submit" disabled={loading} className="mt-4 w-full rounded-lg bg-[#123f2b] px-4 py-3 font-medium text-white hover:bg-[#0f3324] disabled:opacity-60">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 hover:underline">
            Sign in
          </Link>
          <span className="text-gray-400"> · </span>
          <span className="text-xs">New student accounts are approved by the Research Coordinator first.</span>
        </p>
      </div>
    </main>
  );
}
