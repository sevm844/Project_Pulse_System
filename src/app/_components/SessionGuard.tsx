"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutFromApi } from "../_lib/api";
import { AUTH_TOKEN_KEY, getStoredToken } from "../_utils/authStorage";

// One place for the safety nets around a signed-in session:
//  - the browser's Back button must not walk someone out of the system (and look like a log out): it asks first;
//  - every Log out button asks first (they call requestLogout());
//  - a computer left alone signs out by itself after a while (shared school computers);
//  - signing out in one tab signs out the others; the Back button after a log out never shows a cached page.

const CONFIRM_EVENT = "pulse:confirm-logout";
const ACTIVITY_KEY = "project-pulse-last-activity";
const IDLE_MS = 30 * 60 * 1000; // signed out after 30 minutes with no mouse, key, scroll or touch
const WARN_MS = 60 * 1000; // a warning in the last minute

const PORTAL = /^\/(student|adviser|dean|secretary|panelist|grammarian)(\/|$)/;
const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/forgot-password", "/reset-password"]);

// Every Log out button calls this: it opens the confirmation instead of logging out at once.
export function requestLogout() {
  window.dispatchEvent(new Event(CONFIRM_EVENT));
}

// The page on screen. The popstate listener below runs before Next.js moves to the new page, so this is still the old one.
let shownPath = "";

// Registered once when the app loads, before Next.js registers its own listener, so it can stop the move.
if (typeof window !== "undefined") {
  const w = window as typeof window & { __pulseBackGuard?: boolean };

  if (!w.__pulseBackGuard) {
    w.__pulseBackGuard = true;

    window.addEventListener(
      "popstate",
      (event) => {
        if (!getStoredToken() || !PORTAL.test(shownPath) || !PUBLIC_PATHS.has(window.location.pathname)) return;

        // Back was pressed on a portal page and would land on the login or landing page: undo it and ask.
        event.stopImmediatePropagation();
        window.history.go(1);
        requestLogout();
      },
      true,
    );
  }
}

export default function SessionGuard() {
  const pathname = usePathname();
  const [mode, setMode] = useState<"logout" | "idle" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const inPortal = PORTAL.test(pathname);

  useEffect(() => {
    shownPath = pathname;
  }, [pathname]);

  // The Log out confirmation, opened by any Log out button or by the Back button.
  useEffect(() => {
    function open() {
      if (getStoredToken()) setMode("logout");
    }

    window.addEventListener(CONFIRM_EVENT, open);

    return () => window.removeEventListener(CONFIRM_EVENT, open);
  }, []);

  // Escape means "stay".
  useEffect(() => {
    if (mode !== "logout") return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMode(null);
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  // A computer left alone signs out by itself. Activity is shared between tabs through localStorage.
  useEffect(() => {
    if (!inPortal) return;

    let lastWrite = 0;

    function touch(force = false) {
      const now = Date.now();

      if (!force && now - lastWrite < 5000) return;
      lastWrite = now;

      try {
        localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        // Storage blocked: the timer below then simply never fires.
      }
    }

    function check() {
      if (!getStoredToken()) return;

      let last = Date.now();

      try {
        last = Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now();
      } catch {
        return;
      }

      const idle = Date.now() - last;

      if (idle >= IDLE_MS) {
        void signOut(true);
      } else if (idle >= IDLE_MS - WARN_MS) {
        setSecondsLeft(Math.ceil((IDLE_MS - idle) / 1000));
        setMode((current) => (current === "logout" ? current : "idle"));
      } else {
        setMode((current) => (current === "idle" ? null : current));
      }
    }

    const events = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;
    const onActivity = () => touch();

    touch(true);
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true, capture: true }));
    const timer = window.setInterval(check, 5000);

    return () => {
      events.forEach((name) => window.removeEventListener(name, onActivity, { capture: true }));
      window.clearInterval(timer);
    };
  }, [inPortal]);

  // Signed out in another tab, or a page restored from the browser's memory after a log out: leave the portal pages.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      const tokenGone = event.key === null || (event.key === AUTH_TOKEN_KEY && !event.newValue);

      if (tokenGone && PORTAL.test(window.location.pathname)) window.location.replace("/login");
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && !getStoredToken() && PORTAL.test(window.location.pathname)) window.location.replace("/login");
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  async function signOut(expired = false) {
    setBusy(true);
    await logoutFromApi();
    window.location.replace(expired ? "/login?expired=1" : "/login");
  }

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="session-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {mode === "logout" ? (
          <>
            <h2 id="session-title" className="text-lg font-semibold text-[#203028]">Log out of Project Pulse?</h2>
            <p className="mt-2 text-sm leading-6 text-[#59645d]">You will need to sign in again to continue.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setMode(null)} className="rounded-full bg-[#123f2b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3324]">
                Stay signed in
              </button>
              <button type="button" disabled={busy} onClick={() => void signOut()} className="rounded-full border border-[#dfe8df] px-5 py-2 text-sm font-semibold text-[#203028] hover:bg-[#f3f7f1] disabled:opacity-60">
                {busy ? "Logging out..." : "Log out"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="session-title" className="text-lg font-semibold text-[#203028]">Are you still there?</h2>
            <p className="mt-2 text-sm leading-6 text-[#59645d]">
              For your security you will be logged out in {secondsLeft} seconds because nothing has been touched for a while.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  try {
                    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
                  } catch {
                    // ignore
                  }
                  setMode(null);
                }}
                className="rounded-full bg-[#123f2b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3324]"
              >
                Stay signed in
              </button>
              <button type="button" disabled={busy} onClick={() => void signOut()} className="rounded-full border border-[#dfe8df] px-5 py-2 text-sm font-semibold text-[#203028] hover:bg-[#f3f7f1] disabled:opacity-60">
                Log out now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
