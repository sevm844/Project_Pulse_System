"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// The opening of the landing page, every time it is opened or refreshed: kept small and friendly. The logo gives a
// little heartbeat thump, a short pulse line draws under it, three green dots bounce, then the whole thing fades away.
// The server draws it too, so it is there from the first paint.
const RUN_MS = 1600;
const FADE_MS = 450;

export default function LandingSplash() {
  const [phase, setPhase] = useState<"run" | "fade" | "gone">("run");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = reduced ? 300 : RUN_MS;
    const fade = window.setTimeout(() => setPhase("fade"), run);
    const gone = window.setTimeout(() => setPhase("gone"), run + FADE_MS);

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
      aria-label="Loading Project Pulse"
      className="ps-root"
      style={{ opacity: phase === "fade" ? 0 : 1, pointerEvents: phase === "fade" ? "none" : "auto" }}
    >
      <style>{`
        .ps-root { position: fixed; inset: 0; z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: #fff; transition: opacity ${FADE_MS}ms ease-out; }
        .ps-logo { animation: ps-thump 1.1s ease-in-out infinite; }
        .ps-logo img { border-radius: 18px; box-shadow: 0 10px 28px rgba(18,63,43,0.14); }
        .ps-line { width: 150px; height: auto; overflow: visible; }
        .ps-line path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ps-draw 1.1s ease-in-out infinite; }
        .ps-name { font-size: 22px; font-weight: 800; color: #123f2b; letter-spacing: -0.01em; }
        .ps-dots { display: flex; gap: 7px; }
        .ps-dots span { width: 9px; height: 9px; border-radius: 9999px; background: #4ac214; animation: ps-hop 0.9s ease-in-out infinite; }
        .ps-dots span:nth-child(2) { animation-delay: 0.15s; background: #3a7f35; }
        .ps-dots span:nth-child(3) { animation-delay: 0.3s; background: #a8e87a; }
        @keyframes ps-thump { 0%, 100% { transform: scale(1); } 18% { transform: scale(1.12); } 32% { transform: scale(0.98); } 46% { transform: scale(1.07); } 62% { transform: scale(1); } }
        @keyframes ps-draw { 0% { stroke-dashoffset: 1; } 70%, 100% { stroke-dashoffset: 0; } }
        @keyframes ps-hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-7px); } }
        @media (prefers-reduced-motion: reduce) {
          .ps-logo, .ps-dots span { animation: none; }
          .ps-line path { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="ps-logo">
        <Image src="/logotop.png" alt="" width={72} height={72} priority />
      </div>
      <svg viewBox="0 0 150 30" className="ps-line" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M0 15H50L58 4L68 26L76 10L82 15H150" pathLength={1} stroke="#4ac214" />
      </svg>
      <p className="ps-name">Project Pulse</p>
      <div className="ps-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
