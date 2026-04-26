"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidStudentEmail(value: string) {
    return /^\d{7}@ub\.edu\.ph$/.test(value.toLowerCase());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!isValidStudentEmail(normalizedEmail)) {
      setError("Please enter a valid UB student email (e.g. 1234567@ub.edu.ph).");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const newUser = {
        email: normalizedEmail,
        password,
        role: "student",
      };

      setSuccess("Student account created successfully. Redirecting to login...");

        setTimeout(() => {
         window.location.href = "/login";
        }, 1200);
        }, 800);
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white text-gray-900">
      {/* LEFT SIDE */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-black px-16 py-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#064e3b_0%,#022c22_25%,#000_65%)]" />

        <div className="absolute left-16 bottom-20 h-40 w-40 rounded-[2rem] bg-green-500/20 blur-2xl" />
        <div className="absolute right-20 bottom-32 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="absolute left-24 top-1/2 h-2 w-2 rounded-full bg-white/40" />
        <div className="absolute right-36 top-1/3 h-1.5 w-1.5 rounded-full bg-white/30" />
        <div className="absolute left-1/2 bottom-40 h-1 w-1 rounded-full bg-white/50" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Image src="/logotop.png" alt="Project Pulse Logo" width={38} height={38} />
            <span className="text-xl font-semibold">
              Project <span className="text-green-400">Pulse</span>
            </span>
          </div>

          <div className="mt-20 max-w-lg">
            <h1 className="text-4xl font-semibold tracking-tight">
              Create your student account
            </h1>
            <p className="mt-5 text-lg text-gray-300">
              Access your capstone dashboard, monitor progress, submit documents,
              and track feedback in one secure platform.
            </p>
          </div>
        </div>

        <div className="relative z-10 mb-8">
          <div className="relative h-72">
            <div className="absolute left-10 bottom-6 h-28 w-28 rotate-[-18deg] rounded-3xl bg-green-500 shadow-2xl shadow-green-500/20 flex items-center justify-center">
              <span className="text-5xl">📄</span>
            </div>

            <div className="absolute left-52 bottom-28 h-24 w-24 rotate-[10deg] rounded-full bg-emerald-400 shadow-2xl shadow-emerald-400/20 flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>

            <div className="absolute right-16 bottom-10 h-28 w-28 rotate-[14deg] rounded-[2rem] bg-lime-300 shadow-2xl shadow-lime-300/20 flex items-center justify-center">
              <span className="text-5xl">🎓</span>
            </div>
          </div>

          <p className="text-sm text-gray-400">
            Student registration is verified using your UB student email.
          </p>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-end text-sm">
            <span className="text-gray-600">Already have an account?</span>
            <Link href="/login" className="ml-2 font-medium text-gray-900 underline">
              Sign in →
            </Link>
          </div>

          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <Image src="/logotop.png" alt="Logo" width={34} height={34} />
            <span className="text-lg font-semibold">
              Project <span className="text-green-600">Pulse</span>
            </span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-gray-500">
            Register using your UB student email.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Student Email
              </label>
              <input
                type="email"
                placeholder="1234567@ub.edu.ph"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-500">
                Use your 7-digit student ID followed by @ub.edu.ph.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-500">
                Password must be at least 8 characters.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            By creating an account, your role will be automatically assigned as{" "}
            <span className="font-medium text-gray-700">Student</span>.
          </p>
        </div>
      </section>
    </main>
  );
}