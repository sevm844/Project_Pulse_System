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

  // ✅ UB student email validation (7 digits only)
  function isValidStudentEmail(value: string) {
    return /^\d{7}@ub\.edu\.ph$/.test(value.toLowerCase());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Required fields
    if (!normalizedEmail || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    // ✅ UB email validation
    if (!isValidStudentEmail(normalizedEmail)) {
      setError("Please enter a valid UB student email (e.g. 1234567@ub.edu.ph).");
      return;
    }

    // ✅ Password rules
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // ✅ Simulate registration (for now)
    setLoading(true);

    setTimeout(() => {
      const newUser = {
        email: normalizedEmail,
        password,
        role: "student", // 🔥 automatic role assignment
      };

      console.log("Registered user:", newUser);

      setSuccess("Student account created successfully.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setLoading(false);
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
          Create Account
        </h2>
        <p className="text-center text-gray-500 text-sm mt-1">
          Register using your UB student email
        </p>

        {/* ERROR / SUCCESS */}
        {error && (
          <div className="mt-4 text-sm text-red-500 text-center">{error}</div>
        )}
        {success && (
          <div className="mt-4 text-sm text-green-600 text-center">{success}</div>
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

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-4 py-3 border rounded-md outline-none focus:ring-2 focus:ring-green-200"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* LOGIN LINK */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}