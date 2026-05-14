"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, type UserProfile, type UserRole } from "../_lib/firebase";
import { saveStoredUserSession } from "../_utils/authStorage";
import { addAuditLog } from "../_utils/auditLogStorage";
import { clearStoredStudentGroup } from "../student/_utils/studentGroupStorage";

function getRedirectByRole(role: UserRole) {
  if (role === "Student") return "/student/setup";
  if (role === "Adviser") return "/adviser";
  if (role === "Dean") return "/dean";
  if (role === "Coordinator") return "/coordinator";
  if (role === "Panelist") return "/panelist";
  if (role === "Grammarian") return "/grammarian";
  if (role === "Records Staff") return "/records";
  if (role === "Admin") return "/admin";

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
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword,
      );

      const profileRef = doc(db, "users", credential.user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        setError("Account profile was not found. Please contact the admin.");
        setLoading(false);
        return;
      }

      const profile = profileSnap.data() as UserProfile;

      if (profile.status !== "Active") {
        setError("Your account is not active yet.");
        setLoading(false);
        return;
      }

      saveStoredUserSession({
        uid: credential.user.uid,
        email: profile.email,
        role: profile.role,
      });

      addAuditLog({
        userId: credential.user.uid,
        userEmail: profile.email,
        role: profile.role,
        action: "Login",
        module: "Authentication",
        details: `${profile.role} logged in successfully.`,
      });

      if (profile.role === "Student") {
        clearStoredStudentGroup();
      }

      router.push(getRedirectByRole(profile.role));
    } catch {
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
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
            className="w-full rounded-md bg-green-600 py-3 text-white hover:bg-green-700 disabled:opacity-60"
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
