"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// A thin green bar across the top of every page that runs while something the person asked for is loading:
// opening a page, pressing Refresh or any button that fetches, and the first load of the site. It listens to
// the clicks and to window.fetch, so no page has to do anything. Background work (live typing sync, the
// notice checks every few seconds) does not start it: only a fetch that begins right after a click, a key
// press or a page change counts.

const INTENT_MS = 1500; // a fetch that starts this soon after a click or Enter is "asked for"
const QUIET_URLS = ["/collab/", "/snapshot", "/notifications/unread", "/messages/unread"];
const GIVE_UP_MS = 15000;

type Fetch = typeof window.fetch;

export default function NavigationProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement | null>(null);
  const api = useRef<{ begin: () => void; end: () => void; intent: () => void; routeDone: () => void } | null>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;

    let pending = 0;
    let routePending = false;
    let width = 0;
    let trickle: number | undefined;
    let hideTimer: number | undefined;
    let fadeTimer: number | undefined;
    let giveUp: number | undefined;
    let startTimer: number | undefined;
    let lastIntent = 0;
    let running = false;

    const paint = (w: number, opacity: number, animate = true) => {
      width = w;
      el.style.transition = animate ? "width 300ms ease-out, opacity 300ms ease-out" : "none";
      el.style.width = `${w}%`;
      el.style.opacity = String(opacity);
    };

    const start = () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(fadeTimer);
      if (running) return;
      running = true;
      paint(0, 1, false);
      void el.offsetWidth;
      paint(12, 1);
      trickle = window.setInterval(() => {
        // Slows down as it nears the end, never reaches it until the work is done.
        paint(width + (92 - width) * 0.12, 1);
      }, 350);
      giveUp = window.setTimeout(finish, GIVE_UP_MS);
    };

    const finish = () => {
      if (!running) return;
      running = false;
      window.clearInterval(trickle);
      window.clearTimeout(giveUp);
      pending = 0;
      routePending = false;
      paint(100, 1);
      fadeTimer = window.setTimeout(() => paint(100, 0), 220);
      hideTimer = window.setTimeout(() => paint(0, 0, false), 560);
    };

    const check = () => {
      window.clearTimeout(startTimer);
      if (pending > 0 || routePending) {
        // A short delay so a very fast answer never flashes the bar.
        startTimer = window.setTimeout(() => {
          if (pending > 0 || routePending) start();
        }, 120);
      } else {
        finish();
      }
    };

    api.current = {
      begin: () => {
        pending += 1;
        check();
      },
      end: () => {
        pending = Math.max(0, pending - 1);
        check();
      },
      intent: () => {
        lastIntent = Date.now();
      },
      routeDone: () => {
        routePending = false;
        check();
      },
    };

    // The first load of the site.
    lastIntent = Date.now();

    const onPointer = (event: Event) => {
      lastIntent = Date.now();

      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const mouse = event as MouseEvent;
      if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.button > 0) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      routePending = true;
      check();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") lastIntent = Date.now();
    };

    document.addEventListener("click", onPointer, true);
    document.addEventListener("keydown", onKey, true);

    const original: Fetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const counted = Date.now() - lastIntent < INTENT_MS && !QUIET_URLS.some((part) => url.includes(part));

      if (!counted) return original(input, init);

      api.current?.begin();

      return original(input, init).finally(() => api.current?.end());
    };

    return () => {
      document.removeEventListener("click", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
      window.fetch = original;
      window.clearInterval(trickle);
      window.clearTimeout(hideTimer);
      window.clearTimeout(giveUp);
      window.clearTimeout(startTimer);
      api.current = null;
    };
  }, []);

  // A new page arrived: the route part is done.
  useEffect(() => {
    api.current?.routeDone();
  }, [pathname]);

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
