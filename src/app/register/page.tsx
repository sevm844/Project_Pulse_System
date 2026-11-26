"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../_lib/api";
import { passwordIsStrong } from "../_lib/password";
import PasswordStrength from "../_components/PasswordStrength";
import PasswordEye from "../_components/PasswordEye";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Reading the Terms or the Privacy Policy leaves this page (same tab). Keep what was typed, except the passwords, for the way back.
  const DRAFT_KEY = "project-pulse-register-draft";

  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");

      if (saved) {
        queueMicrotask(() => {
          setFullName(String(saved.fullName ?? ""));
          setEmail(String(saved.email ?? ""));
          setAgreed(saved.agreed === true);
        });
      }
    } catch {
      // Storage blocked or unreadable: start with an empty form.
    }
  }, []);

  function saveDraft(next: { fullName?: string; email?: string; agreed?: boolean }) {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fullName, email, agreed, ...next }));
    } catch {
      // ignore
    }
  }

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
      setError("Use a password of 8 or more characters with an uppercase and a lowercase letter, a number and a special character.");
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

      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }

      setSuccess(
        "Account created. You can log in now. Your adviser will add you to a group. Redirecting to login...",
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
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100";

  // Little stars on the dark side: [left %, top %, size px, how bright].
  const stars: [number, number, number, number][] = [
    [8, 62, 2, 0.5], [18, 78, 3, 0.8], [30, 55, 2, 0.4], [44, 70, 2, 0.6], [58, 60, 3, 0.9], [70, 76, 2, 0.5],
    [82, 58, 2, 0.7], [90, 72, 3, 0.8], [12, 90, 2, 0.6], [36, 88, 2, 0.5], [52, 92, 3, 0.8], [76, 90, 2, 0.6],
    [95, 52, 2, 0.4], [24, 66, 2, 0.5], [64, 84, 2, 0.5],
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900 lg:grid lg:h-screen lg:grid-cols-2">
      {/* The left side: black fading into dark green, what the system gives a student, and a few floating pieces of the journey. */}
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#040605_0%,#06100b_42%,#0b3322_100%)] text-white lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_112%,rgba(74,222,128,0.5),transparent_62%)]" />
        {stars.map(([left, top, size, alpha], index) => (
          <span key={index} aria-hidden="true" className="pointer-events-none absolute rounded-full bg-white" style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, opacity: alpha }} />
        ))}

        <div className="relative z-10 mx-auto w-fit max-w-[40rem] px-6 pt-[116px]">
          <h2 className="text-3xl font-semibold tracking-tight">Create your capstone account</h2>
          <p className="mt-1 text-sm text-white/70">Everything for your thesis, from the first title to the final defense, in one place.</p>

          <ul className="mt-6 space-y-3.5">
            {[
              ["Title proposals", "Send up to three titles to your adviser and follow each decision."],
              ["Your manuscript, in the browser", "Write, save versions and get comments without leaving the system."],
              ["Defenses and results", "See your schedule, panel and results as soon as they are set."],
              ["Notices by email", "Hear about feedback and approvals even when you are not logged in."],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span aria-hidden="true" className="text-sm leading-5 text-[#4ade80]">
                  ✓
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm leading-5 text-white/60">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0 h-[270px]">
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center justify-center drop-shadow-[0_0_40px_rgba(74,222,128,0.45)]">
            <Image src="/cict-logo-light.png" alt="College of Information and Communications Technology" width={190} height={190} />
          </div>
          <div className="absolute bottom-44 left-[8%] -rotate-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/55">Title Proposal</p>
            <p className="text-sm font-semibold text-[#86efac]">Approved</p>
          </div>
          <div className="absolute bottom-28 right-[7%] rotate-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/55">Proposal Defense</p>
            <p className="text-sm font-semibold">Scheduled</p>
          </div>
          <div className="absolute bottom-4 left-[10%] rotate-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/55">Manuscript</p>
            <p className="text-sm font-semibold">Version 3 saved</p>
          </div>
        </div>
      </aside>

      {/* The form side. */}
      <section className="relative flex min-h-screen items-start justify-center overflow-y-auto px-6 pb-8 pt-[120px] lg:min-h-0">
        <p className="absolute right-6 top-5 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gray-900 underline">
            Sign in →
          </Link>
        </p>

        <div className="w-full max-w-md">
          <h1 className="text-xl font-semibold tracking-tight">Sign up for Project Pulse</h1>
          <p className="mt-1 text-sm text-gray-500">Register using your UB student email.</p>

          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
          {success && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">{success}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Full Name</label>
              <input type="text" placeholder="Juan Dela Cruz" className={input} value={fullName} onChange={(e) => { setFullName(e.target.value); saveDraft({ fullName: e.target.value }); }} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Student Email</label>
              <input type="email" placeholder="1234567@ub.edu.ph" className={input} value={email} onChange={(e) => { setEmail(e.target.value); saveDraft({ email: e.target.value }); }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Password" className={`${input} pr-11`} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <PasswordEye shown={showPassword} onClick={() => setShowPassword((value) => !value)} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} placeholder="Confirm password" className={`${input} pr-11`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <PasswordEye shown={showConfirm} onClick={() => setShowConfirm((value) => !value)} label="password confirmation" />
                </div>
              </div>
            </div>

            <PasswordStrength password={password} />

            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); saveDraft({ agreed: e.target.checked }); }} className="mt-1 h-4 w-4 accent-[#123f2b]" />
              <span>
                I agree to the{" "}
                <Link href="/terms?from=register" className="font-medium text-gray-900 underline">
                  Terms and Conditions
                </Link>{" "}
                and the{" "}
                <Link href="/privacy?from=register" className="font-medium text-gray-900 underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#123f2b] px-4 py-3 font-medium text-white hover:bg-[#0f3324] disabled:opacity-60">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400">After you log in, wait for your adviser to add you to a group.</p>
        </div>
      </section>
    </main>
  );
}
