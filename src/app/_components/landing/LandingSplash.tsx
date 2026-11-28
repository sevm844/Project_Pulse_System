"use client";

import { useEffect, useState } from "react";

// What the visitor sees every time the landing page is opened or refreshed: a white screen with the heartbeat line,
// held for a moment (so it is seen even when the page is fast) and then faded away. The server draws it too, so it is there from the first paint.
const HOLD_MS = 1300;
const FADE_MS = 450;

export default function LandingSplash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fade = window.setTimeout(() => setPhase("fade"), reduced ? 300 : HOLD_MS);
    const gone = window.setTimeout(() => setPhase("gone"), (reduced ? 300 : HOLD_MS) + FADE_MS);

    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-white"
      style={{ opacity: phase === "fade" ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-out`, pointerEvents: phase === "fade" ? "none" : "auto" }}
    >
      <svg viewBox="0 0 120 40" className="h-12 w-36" fill="none" aria-hidden="true">
        <path d="M2 22h26l6-14 10 28 8-20 6 6h60" stroke="#dfe8d6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path className="pulse-line" d="M2 22h26l6-14 10 28 8-20 6 6h60" stroke="#3a7f35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm font-semibold text-[#123f2b]">
        Project Pulse<span className="loading-dots" />
      </p>
    </div>
  );
}
