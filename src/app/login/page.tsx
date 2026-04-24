"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidStudentEmail(value: string) {
    return /^\d{7}@ub\.edu\.ph$/.test(value.toLowerCase());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isValidStudentEmail(normalizedEmail)) {
      setError("Please enter a valid UB student email (e.g. 1234567@ub.edu.ph).");
      return;
    }

    setLoading(true);

    // Simulated login
    setTimeout(() => {
      const user = {
        email: normalizedEmail,
        role: "student",
      };

      console.log("Logged in user:", user);

      if (user.role === "student") {
        router.push("/student");
      } else {
        setError("Unauthorized role.");
        setLoading(false);
      }
    }, 800);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-8">
        {/* LOGO */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image src="/Logo.png" alt="Logo" width={34} height={34} />
          <span className="text-lg font-semibold">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-center">
          Log in
        </h2>
        <p className="text-center text-gray-500 text-sm mt-1">
          Sign in using your UB student email
        </p>

        {/* ERROR */}
        {error && (
          <div className="mt-4 text-sm text-red-500 text-center">{error}</div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Student Email (1234567@ub.edu.ph)"
            className="w-full px-4 py-3 border rounded-md outline-none focus:ring-2 focus:ring-green-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-md outline-none focus:ring-2 focus:ring-green-200"
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
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* REGISTER LINK */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-green-600 hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}