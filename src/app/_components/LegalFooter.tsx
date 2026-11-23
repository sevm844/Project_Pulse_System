"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

// The line at the bottom of the Terms and the Privacy Policy. Opened from the Create Account page (?from=register) it leads
// back there; opened from anywhere else it leads back to the login page. The other legal page keeps the same "from".
export default function LegalFooter({ updated, other }: { updated: string; other: { href: string; label: string } }) {
  const fromRegister = useSearchParams().get("from") === "register";
  const otherHref = fromRegister ? `${other.href}?from=register` : other.href;

  return (
    <p className="mt-5 text-center text-xs text-gray-500">
      Last updated {updated}
      {" · "}
      <Link href={otherHref} className="text-green-600 hover:underline">
        {other.label}
      </Link>
      {" · "}
      <Link href={fromRegister ? "/register" : "/login"} className="text-green-600 hover:underline">
        {fromRegister ? "Back to create account" : "Back to login"}
      </Link>
    </p>
  );
}
