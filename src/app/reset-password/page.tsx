"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import AuthSplit from "../_components/AuthSplit";
import PasswordStrength from "../_components/PasswordStrength";
import PasswordEye from "../_components/PasswordEye";
import { ApiError, apiFetch } from "../_lib/api";
import { passwordIsStrong } from "../_lib/password";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  // An invitation email (a new faculty account) opens this page with welcome=1: it asks to confirm the account.
  const welcome = params.get("welcome") === "1";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ password: false, confirm: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!passwordIsStrong(password)) return setError("Your password does not follow all the rules yet.");
    if (password !== confirm) return setError("The two passwords do not match.");

    setBusy(true);

    try {
      const result = await apiFetch<{ message: string }>("/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, email, password, password_confirmation: confirm }),
      });
      setDone(welcome ? "Your account is confirmed and your password is set. Taking you to the login page..." : result.message);
      if (welcome) setTimeout(() => (window.location.href = "/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to change the password. Please try again.");
    }

    setBusy(false);
  }

  if (!token || !email) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">This link is incomplete. Open the link from your email again, or ask for a new one.</p>
        <Link href="/forgot-password" className="block w-full rounded-xl bg-gradient-to-r from-[#123f2b] to-[#2f8f4e] py-3.5 text-center text-sm font-semibold text-white hover:brightness-110">
          Ask for a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{done}</p>
        <Link href="/login" className="block w-full rounded-xl bg-gradient-to-r from-[#123f2b] to-[#2f8f4e] py-3.5 text-center text-sm font-semibold text-white hover:brightness-110">
          Go to login
        </Link>
      </div>
    );
  }

  const field = "w-full rounded-xl border border-[#dfe3e0] py-3 pl-4 pr-11 text-sm font-normal outline-none focus:border-[#2f6b3c] focus:ring-2 focus:ring-[#cfe0d3]";

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}{" "}
          {/not valid any more/i.test(error) && (
            <Link href="/forgot-password" className="font-semibold underline">
              Ask for a new link
            </Link>
          )}
        </p>
      )}

      {/* Lets the browser and password managers know which account this password belongs to. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <p className="text-xs text-[#7b877f]">
        Account: <span className="font-semibold text-[#203028]">{email}</span>
      </p>

      <label className="block text-sm font-semibold text-[#111]">
        New Password
        <span className="relative mt-1.5 block">
          <input
            type={show.password ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
            className={field}
          />
          <PasswordEye shown={show.password} onClick={() => setShow({ ...show, password: !show.password })} label="new password" />
        </span>
      </label>

      <PasswordStrength password={password} />

      <label className="block text-sm font-semibold text-[#111]">
        Confirm New Password
        <span className="relative mt-1.5 block">
          <input
            type={show.confirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Re-enter your new password"
            className={field}
          />
          <PasswordEye shown={show.confirm} onClick={() => setShow({ ...show, confirm: !show.confirm })} label="password confirmation" />
        </span>
      </label>

      <button type="submit" disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-[#123f2b] to-[#2f8f4e] py-3.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
        {busy ? "Saving..." : welcome ? "Confirm Account" : "Create New Password"}
      </button>

      <p className="text-center text-xs leading-5 text-[#7b877f]">
        By {welcome ? "confirming your account" : "saving your password"} you agree to the{" "}
        <Link href="/terms" target="_blank" className="text-[#203028] underline">
          Terms and Conditions
        </Link>{" "}
        and the{" "}
        <Link href="/privacy" target="_blank" className="text-[#203028] underline">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-xs text-[#7b877f]">
        Remembered it?{" "}
        <Link href="/login" className="text-[#203028] underline">
          Login
        </Link>
      </p>
    </form>
  );
}

function ResetPage() {
  const welcome = useSearchParams().get("welcome") === "1";

  return (
    <AuthSplit
      title={welcome ? "Confirm your account" : "Set a new password"}
      subtitle={welcome ? "Choose your own password to confirm your account. After that you will go to the login page." : "Create a strong password to keep your account safe and secure."}
    >
      <ResetForm />
    </AuthSplit>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#7b877f]">Loading...</p>}>
      <ResetPage />
    </Suspense>
  );
}
