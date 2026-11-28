"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// A thin green bar across the top that runs only when someone ARRIVES at their dashboard: right after logging in,
// or when the dashboard is opened or refreshed. Moving between the pages inside a portal (including pressing
// "Dashboard" in the sidebar) never shows it.
const DASHBOARD = /^\/(dean|student|adviser|panelist|grammarian|secretary)\/?$/;
const RUN_MS = 1300;

export default function NavigationProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement | null>(null);
  const previous = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const before = previous.current;
    previous.current = pathname;

    const match = DASHBOARD.exec(pathname);
    if (!match) return;

    // Already inside this portal (any page of it): not an arrival.
    if (before !== null && before.startsWith(`/${match[1]}`)) return;

    const el = bar.current;
    if (!el) return;

    const paint = (width: number, opacity: number, animate: boolean, ms = 300) => {
      el.style.transition = animate ? `width ${ms}ms ease-out, opacity 300ms ease-out` : "none";
      el.style.width = `${width}%`;
      el.style.opacity = String(opacity);
    };
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    paint(0, 1, false);
    void el.offsetWidth;
    paint(14, 1, true, 200);
    later(() => paint(58, 1, true, 450), 200);
    later(() => paint(86, 1, true, 600), 650);
    later(() => paint(100, 1, true, 200), RUN_MS - 200);
    later(() => paint(100, 0, true), RUN_MS + 80);
    later(() => paint(0, 0, false), RUN_MS + 420);
  }, [pathname]);

  useEffect(() => {
    const pending = timers.current;

    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-full">
      <div
        ref={bar}
        className="h-full w-0 opacity-0"
        style={{ background: "linear-gradient(90deg, #3a7f35, #4ac214, #a8e87a)", boxShadow: "0 0 10px rgba(74,194,20,0.65)" }}
      />
    </div>
  );
}
