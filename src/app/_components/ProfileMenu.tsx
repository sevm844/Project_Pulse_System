"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { requestLogout } from "./SessionGuard";

// The round picture at the top right. Clicking it opens a small menu: Settings (where the person edits their personal information, picture and password) and Log out.
export default function ProfileMenu({
  name,
  email,
  image,
  initials,
  settingsHref,
}: {
  name: string;
  email: string;
  image: string | null;
  initials: string;
  settingsHref: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your profile menu"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#d7f7d8] bg-cover bg-center text-xs font-semibold text-[#203028] ring-offset-2 transition hover:ring-2 hover:ring-[#a8e87a]"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        {!image && initials}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-[#dfe8df] bg-white shadow-[0_18px_50px_rgba(32,48,40,0.16)]">
          <div className="border-b border-[#edf2ec] px-4 py-3">
            <p className="truncate text-sm font-semibold text-[#203028]">{name}</p>
            <p className="truncate text-[11px] text-[#7b877f]">{email}</p>
          </div>
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#203028] transition hover:bg-[#f3f8f4]"
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              requestLogout();
            }}
            className="block w-full border-t border-[#edf2ec] px-4 py-2.5 text-left text-sm text-[#59645d] transition hover:bg-[#f3f8f4]"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
