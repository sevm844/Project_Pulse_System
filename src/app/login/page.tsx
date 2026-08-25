"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
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
  if (role === "Admin") return "/dean";

  return "/login";
}

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Unable to log in. Please try again.";
  }

  if (
    error.code === "auth/invalid-credential" ||
    error.code === "auth/user-not-found" ||
    error.code === "auth/wrong-password" ||
    error.code === "auth/invalid-email"
  ) {
    return "Invalid email or password.";
  }

  if (error.code === "auth/too-many-requests") {
    return "Too many login attempts. Please try again later.";
  }

  if (error.code === "auth/configuration-not-found") {
    return "Firebase Authentication is not configured for this app.";
  }

  return "Unable to log in. Please try again.";
}

function getProfileErrorMessage(error: unknown) {
  if (error instanceof FirebaseError && error.code === "permission-denied") {
    return "Login succeeded, but the app cannot read your account profile. Please check Firestore rules for the users collection.";
  }

  return "Login succeeded, but your account profile could not be loaded. Please contact the admin.";
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

    let credential;

    try {
      credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword,
      );
    } catch (error) {
      setError(getAuthErrorMessage(error));
      setLoading(false);
      return;
    }

    try {
      const profileRef = doc(db, "users", credential.user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        await signOut(auth);
        setError("Account profile was not found. Please contact the admin.");
        setLoading(false);
        return;
      }

      const profile = profileSnap.data() as UserProfile;

      if (profile.status !== "Active") {
        await signOut(auth);
        setError("Your account is not active yet.");
        setLoading(false);
        return;
      }

      saveStoredUserSession({
        uid: credential.user.uid,
        email: profile.email,
        role: profile.role,
      });

      try {
        addAuditLog({
          userId: credential.user.uid,
          userEmail: profile.email,
          role: profile.role,
          action: "Login",
          module: "Authentication",
          details: `${profile.role} logged in successfully.`,
        });
      } catch (auditError) {
        console.warn("Login audit log could not be saved.", auditError);
      }

      if (profile.role === "Student") {
        clearStoredStudentGroup();
      }

      router.push(getRedirectByRole(profile.role));
    } catch (error) {
      console.error("Login profile load failed.", error);
      await signOut(auth).catch(() => undefined);
      setError(getProfileErrorMessage(error));
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
