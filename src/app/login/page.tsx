"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { UserRole } from "../_lib/firebase";
import { ApiError, apiFetch, toAppRole } from "../_lib/api";
import { saveStoredToken, saveStoredUserSession } from "../_utils/authStorage";
import { addAuditLog } from "../_utils/auditLogStorage";
import {
  clearStoredStudentGroup,
  getStoredStudentGroup,
  hasAcknowledgedStudentSetup,
} from "../student/_utils/studentGroupStorage";

type LoginResponse = {
  token: string;
  user: {
    user_id: number;
    fname: string;
    lname: string;
    email: string;
    role: string;
  };
};

function storedGroupBelongsToStudent(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const storedGroup = getStoredStudentGroup();

  return Boolean(
    storedGroup?.members.some(
      (member) => member.email.toLowerCase() === normalizedEmail,
    ),
  );
}

function getRedirectByRole(role: UserRole, email: string) {
  if (role === "Student") {
    return hasAcknowledgedStudentSetup(email) &&
      storedGroupBelongsToStudent(email)
      ? "/student"
      : "/student/setup";
  }

  if (role === "Adviser") return "/adviser";
  if (role === "Dean") return "/dean";
  if (role === "Coordinator") return "/coordinator";
  if (role === "Panelist") return "/panelist";
  if (role === "Grammarian") return "/grammarian";
  if (role === "Records Staff") return "/records";
  if (role === "Admin") return "/dean";

  return "/login";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      saveStoredUserSession({ uid, email: result.user.email, role });

      try {
        addAuditLog({
          userId: uid,
          userEmail: result.user.email,
          role,
          action: "Login",
          module: "Authentication",
          details: `${role} logged in successfully.`,
        });
      } catch (auditError) {
        console.warn("Login audit log could not be saved.", auditError);
      }

      if (role === "Student" && !storedGroupBelongsToStudent(result.user.email)) {
        clearStoredStudentGroup();
      }

      router.push(getRedirectByRole(role, result.user.email));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to log in. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9f9ff] px-6">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(207,247,236,0.32),rgba(249,249,255,0)_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3eb_1px,transparent_1px)] opacity-45 [background-size:24px_24px]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/72 p-8 shadow-[0_24px_70px_rgba(31,42,36,0.12)] backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Image src="/Logo-icon.png" alt="Logo" width={34} height={34} />
          <span className="text-lg font-semibold">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

        <h2 className="text-center text-2xl font-semibold">Log in</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Sign in using your approved UB account
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-green-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-green-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-green-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#123f2b] py-3 text-white hover:bg-[#0f3324] disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-green-600 hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}