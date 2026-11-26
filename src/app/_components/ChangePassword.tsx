"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../_lib/api";
import { passwordIsStrong } from "../_lib/password";
import { getStoredUserEmail } from "../_utils/authStorage";
import PasswordStrength from "./PasswordStrength";
import PasswordEye from "./PasswordEye";

// Every person changes their own password here. Two real-life cases:
//  1. They know their current password: type it, then the new one twice. The rules only show (as a short "still needed" line) when the new password is not good enough.
//  2. They do NOT remember it (the usual reason to change it): "I don't remember my current password" emails them a one-time link (the same link as on the sign-in
//     page) to choose a new password without the old one. Their other devices are signed out afterwards either way.
export default function ChangePassword() {
  const email = getStoredUserEmail() ?? "";
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [forgot, setForgot] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [linkError, setLinkError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDone("");

    if (!current) return setError("Enter your current password, or use \"I don't remember my current password\" below.");
    if (!passwordIsStrong(password)) return setError("Your new password does not follow all the rules yet.");
    if (password !== confirm) return setError("The two new passwords do not match.");

    setBusy(true);

    try {
      const result = await apiFetch<{ message: string }>("/me/password", {
        method: "PUT",
        body: JSON.stringify({ current_password: current, password, password_confirmation: confirm }),
      });
      setDone(result.message);
      setCurrent("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to change the password. Please try again.");
    }

    setBusy(false);
  }

  async function sendLink() {
    setLinkBusy(true);
    setLinkError("");

    try {
      await apiFetch<{ message: string }>("/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setLinkSent(true);
    } catch (err) {
      setLinkError(err instanceof ApiError ? err.message : "Unable to send the e-mail. Please try again.");
    }

    setLinkBusy(false);
  }

  const field = "h-9 w-full rounded-lg border border-[#dfe8df] bg-white pl-3 pr-11 text-sm font-normal outline-none focus:border-[#2f6b3c] focus:ring-2 focus:ring-[#cfe0d3]";
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <article className="rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_12px_32px_rgba(31,42,36,0.06)]">
      <h3 className="text-sm font-semibold text-[#203028]">Change Password</h3>
      <p className="mt-0.5 text-[11px] text-[#7b877f]">Only you know your password. Nobody, including the Dean, can see or set it.</p>

      <form onSubmit={submit} className="mt-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#203028]">
              Current password
              <span className="relative mt-1 block">
                <input type={showCurrent ? "text" : "password"} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
                <PasswordEye shown={showCurrent} onClick={() => setShowCurrent(!showCurrent)} label="current password" />
              </span>
            </label>
            <button
              type="button"
              onClick={() => {
                setForgot(!forgot);
                setLinkSent(false);
                setLinkError("");
              }}
              aria-expanded={forgot}
              className="mt-1.5 text-[11px] font-semibold text-[#2f6b3c] underline"
            >
              I don&apos;t remember my current password
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#203028]">
              New password
              <span className="relative mt-1 block">
                <input type={showNew ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                <PasswordEye shown={showNew} onClick={() => setShowNew(!showNew)} label="new password" />
              </span>
            </label>
            <PasswordStrength password={password} hint />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#203028]">
              Confirm new password
              <span className="relative mt-1 block">
                <input type={showConfirm ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
                <PasswordEye shown={showConfirm} onClick={() => setShowConfirm(!showConfirm)} label="password confirmation" />
              </span>
            </label>
            {mismatch && <p className="mt-1.5 text-[11px] font-semibold text-amber-700">The two passwords are not the same yet.</p>}
          </div>
        </div>

        {forgot && (
          <div className="mt-3 rounded-xl border border-[#cfe0d3] bg-[#f3f8f4] p-3">
            {!linkSent ? (
              <>
                <p className="text-xs font-semibold text-[#203028]">No problem. We will e-mail you a link.</p>
                <p className="mt-1 text-[11px] leading-4 text-[#59645d]">
                  It goes to <span className="font-semibold text-[#203028]">{email || "your e-mail address"}</span>. Open the link and choose a new password: you will not need the old one.
                  The link works for 60 minutes. When you finish, you sign in again with the new password.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void sendLink()}
                    disabled={linkBusy || !email}
                    className="h-8 rounded-full bg-[#123f2b] px-4 text-[11px] font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
                  >
                    {linkBusy ? "Sending..." : "E-mail me the link"}
                  </button>
                  <button type="button" onClick={() => setForgot(false)} className="text-[11px] font-semibold text-[#59645d] hover:text-[#111]">
                    Cancel
                  </button>
                </div>
                {linkError && (
                  <p role="alert" className="mt-2 text-[11px] text-red-600">
                    {linkError}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-emerald-700">The e-mail is on its way.</p>
                <p className="mt-1 text-[11px] leading-4 text-[#59645d]">
                  We sent the link to <span className="font-semibold text-[#203028]">{email}</span>. It can take a few minutes: look in the Spam or Junk folder too.
                  If nothing arrives, ask the Dean&apos;s office.
                </p>
                <button type="button" onClick={() => setForgot(false)} className="mt-2 text-[11px] font-semibold text-[#59645d] hover:text-[#111]">
                  Close
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="h-9 rounded-full bg-[#123f2b] px-5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60">
            {busy ? "Saving..." : "Change password"}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
        {done && <p className="mt-2 text-xs text-emerald-700">{done}</p>}
      </form>
    </article>
  );
}
