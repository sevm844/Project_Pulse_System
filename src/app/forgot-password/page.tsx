"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthSplit from "../_components/AuthSplit";
import { ApiError, apiFetch } from "../_lib/api";

// Anyone can ask for a link by email; they choose the new password themselves on the next page. The Dean never sees it.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address) return setError("Enter the email address of your account.");

    setBusy(true);
    setError("");

    try {
      const result = await apiFetch<{ message: string }>("/forgot-password", { method: "POST", body: JSON.stringify({ email: address }) });
      setSent(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to send the email. Please try again.");
    }

    setBusy(false);
  }

  return (
    <AuthSplit title="Forgot your password?" subtitle="Enter your account email. We will send you a link to choose a new password yourself.">
      {sent ? (
        <div className="space-y-5">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{sent}</p>
          <p className="text-xs leading-5 text-[#7b877f]">Nothing in your inbox? Check the spam folder, wait a minute, or try again with the email you registered with.</p>
          <Link href="/login" className="block w-full rounded-xl bg-gradient-to-r from-[#123f2b] to-[#2f8f4e] py-3.5 text-center text-sm font-semibold text-white hover:brightness-110">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <label className="block text-sm font-semibold text-[#111]">
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="1234567@ub.edu.ph"
              className="mt-2 w-full rounded-xl border border-[#dfe3e0] px-4 py-3 text-sm font-normal outline-none focus:border-[#2f6b3c] focus:ring-2 focus:ring-[#cfe0d3]"
            />
          </label>

          <button type="submit" disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-[#123f2b] to-[#2f8f4e] py-3.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
            {busy ? "Sending..." : "Email me a link"}
          </button>

          <p className="text-center text-xs text-[#7b877f]">
            Remembered it?{" "}
            <Link href="/login" className="text-[#203028] underline">
              Login
            </Link>
          </p>
        </form>
      )}
    </AuthSplit>
  );
}
