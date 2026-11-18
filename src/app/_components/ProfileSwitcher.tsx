"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetch, toAppRole, toServerRole } from "../_lib/api";
import { roleHomePath } from "../_lib/roleHome";
import type { UserRole } from "../_lib/types";
import { getStoredUserEmail, getStoredUserName, getStoredUserRole, getStoredUserUid, initialsOf, saveStoredUserSession } from "../_utils/authStorage";

// Each role of a person is its own profile (their Adviser profile, their Grammarian profile). This is the name beside the picture in the top bar:
// for a person with 2 or more roles it opens the list of profiles, and choosing one switches to it. Nothing special shows for everyone else.
const TINT: Record<string, string> = {
  Adviser: "bg-[#d7f7d8] text-[#164832]",
  Grammarian: "bg-[#e3ecff] text-[#23407a]",
  Panelist: "bg-[#fdebc8] text-[#7a4a05]",
};

export default function ProfileSwitcher({ name, email, image, roles }: { name: string; email: string; image: string | null; roles: UserRole[] }) {
  const current = getStoredUserRole();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<UserRole | null>(null);
  const [error, setError] = useState("");
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

  async function switchTo(next: UserRole) {
    if (next === current) {
      setOpen(false);
      return;
    }

    setBusy(next);
    setError("");

    try {
      const result = await apiFetch<{ role: string }>("/me/role", {
        method: "PUT",
        body: JSON.stringify({ role: toServerRole(next) }),
      });
      const role = toAppRole(result.role);

      saveStoredUserSession({
        uid: getStoredUserUid() ?? "",
        email: getStoredUserEmail() ?? "",
        name: getStoredUserName() ?? undefined,
        role,
        roles,
      });
      // A full load, so nothing from the other profile (lists, drafts, notices) stays on screen.
      window.location.assign(roleHomePath(role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not switch. Please try again.");
      setBusy(null);
    }
  }

  const plain = (
    <div className="text-right">
      <p className="text-xs font-semibold">{name}</p>
      <p className="text-[10px] text-[#7b877f]">{email}</p>
    </div>
  );

  if (roles.length < 2 || !current) return plain;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-right transition hover:bg-[#f3f7f1]"
      >
        <span>
          <span className="block text-xs font-semibold">{name}</span>
          <span className="block text-[10px] font-semibold text-[#2f8f4e]">{current} profile</span>
        </span>
        <span aria-hidden="true" className="text-[10px] text-[#7b877f]">
          ▾
        </span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#dfe8df] bg-white p-3 shadow-[0_18px_50px_rgba(31,42,36,0.18)]">
          <p className="px-2 pb-2 text-xs font-semibold text-[#203028]">Switch profile</p>
          <p className="px-2 pb-3 text-[11px] leading-4 text-[#7b877f]">You have {roles.length} profiles on this account. Each one opens that role&apos;s own pages.</p>

          <ul className="space-y-1">
            {roles.map((role) => {
              const isCurrent = role === current;

              return (
                <li key={role}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy !== null}
                    onClick={() => void switchTo(role)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${isCurrent ? "bg-[#f1f8ef]" : "hover:bg-[#f7faf6]"} disabled:opacity-60`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cover bg-center text-sm font-semibold ${TINT[role] ?? "bg-[#eef1ee] text-[#203028]"}`}
                      style={image ? { backgroundImage: `url(${image})` } : undefined}
                    >
                      {!image && initialsOf(name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#203028]">{role}</span>
                      <span className="block truncate text-[11px] text-[#7b877f]">{name}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#2f8f4e]">{busy === role ? "Switching..." : isCurrent ? "Current" : ""}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {error && <p className="px-2 pt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
