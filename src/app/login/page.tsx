"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { clearStoredStudentGroup } from "../student/_utils/studentGroupStorage";

const demoStaffAccounts = [
  {
    email: "anna.cruz@ub.edu.ph",
    password: "adviser123",
    role: "Adviser",
    redirectTo: "/adviser",
  },
  {
    email: "dean.office@ub.edu.ph",
    password: "dean123",
    role: "Dean",
    redirectTo: "/dean",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidStudentEmail(value: string) {
    return /^\d{7}@ub\.edu\.ph$/.test(value.toLowerCase());
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

// Temporary staff login until database authentication is connected.
    const staffAccount = demoStaffAccounts.find(
      (account) =>
        account.email === normalizedEmail &&
        account.password === normalizedPassword,
    );

    if (staffAccount) {
      localStorage.setItem("project-pulse-user-email", staffAccount.email);
      localStorage.setItem("project-pulse-user-role", staffAccount.role);

      router.push(staffAccount.redirectTo);
      return;
    }

    if (!isValidStudentEmail(normalizedEmail)) {
      setError(
        "Please enter a valid UB student email or an approved staff account.",
      );
      setLoading(false);
      return;
    }

// Temporary student login for frontend testing.
    setTimeout(() => {
      const user = {
        email: normalizedEmail,
        role: "Student",
      };

      localStorage.setItem("project-pulse-user-email", user.email);
      localStorage.setItem("project-pulse-user-role", user.role);

      clearStoredStudentGroup();
      router.push("/student/setup");
    }, 800);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
{/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <Image src="/Logo-icon.png" alt="Logo" width={34} height={34} />
          <span className="text-lg font-semibold">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

{/* Heading */}
        <h2 className="text-center text-2xl font-semibold">Log in</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Sign in using your UB account
        </p>

        {error && (
          <div className="mt-4 text-center text-sm text-red-500">{error}</div>
        )}

{/* Login form */}
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
            className="w-full rounded-md bg-green-600 py-3 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

{/* Register link */}
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
