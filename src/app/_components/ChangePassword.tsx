"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../_lib/api";
import { passwordIsStrong } from "../_lib/password";
import PasswordStrength from "./PasswordStrength";

// Every person changes their own password here (current one first). Their other devices are signed out afterwards.
export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDone("");

    if (!current) return setError("Enter your current password.");
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

  const field = "mt-2 h-11 w-full rounded-lg border border-[#dfe8df] bg-white px-3 text-sm font-normal outline-none focus:border-[#2f6b3c] focus:ring-2 focus:ring-[#cfe0d3]";
  const type = show ? "text" : "password";

  return (
    <article className="mt-5 rounded-lg border border-[#edf2ec] bg-white p-5">
      <h3 className="text-base font-semibold text-[#203028]">Change Password</h3>
      <p className="mt-1 text-xs text-[#7b877f]">Only you know your password. Nobody, including the Dean, can see or set it.</p>

      <form onSubmit={submit} className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-[#203028]">
            Current password
            <input type={type} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
          </label>
          <label className="block text-xs font-semibold text-[#203028]">
            New password
            <input type={type} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </label>
          <label className="block text-xs font-semibold text-[#203028]">
            Confirm new password
            <input type={type} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={busy} className="h-11 rounded-full bg-[#123f2b] px-6 text-sm font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60">
              {busy ? "Saving..." : "Change password"}
            </button>
            <button type="button" onClick={() => setShow(!show)} className="text-xs font-semibold text-[#59645d] hover:text-[#111]">
              {show ? "Hide passwords" : "Show passwords"}
            </button>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
          {done && <p className="text-xs text-emerald-700">{done}</p>}
        </div>

        <PasswordStrength password={password} />
      </form>
    </article>
  );
}
