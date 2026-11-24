"use client";

import Image from "next/image";
import type { ChangeEvent } from "react";
import type { UserRole } from "../_lib/types";
import { getStoredUserEmail, getStoredUserName } from "../_utils/authStorage";
import ChangePassword from "./ChangePassword";
import { useProfilePhoto } from "./useProfilePhoto";

const DEFAULT_AVATAR = "/default-avatar.svg";

// Name, email and role come from the signed-in account; only the Dean's office can change them.
// The profile photo is saved on the server, so it shows on every device, and appears in the header next to the user's name.
// Three small cards that fit one screen without scrolling: picture, account information, password.
export default function RoleProfileContent({
  role,
  slug,
}: {
  role: UserRole;
  slug: string;
}) {
  const { photo, busy, error, change, remove } = useProfilePhoto(slug);
  const avatar = photo || DEFAULT_AVATAR;

  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void change(file);
  }

  const details = [
    ["Name", getStoredUserName() ?? "-"],
    ["E-mail", getStoredUserEmail() ?? "-"],
    ["Role", role],
  ] as const;

  const card = "rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_12px_32px_rgba(31,42,36,0.06)]";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[#203028]">Settings</h2>
        <p className="mt-1 text-sm text-[#59645d]">Your account information, profile picture and password.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        <article className={card}>
          <h3 className="text-sm font-semibold text-[#203028]">Profile Picture</h3>

          <div className="mt-3 flex items-center gap-4">
            <Image
              src={avatar}
              alt="Profile"
              width={72}
              height={72}
              unoptimized={avatar.startsWith("data:") || avatar.endsWith(".svg")}
              className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#123f2b] px-4 text-xs font-semibold text-white transition hover:bg-[#0f3324]">
                  Upload a new one
                  <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={changePhoto} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={busy || !photo}
                  className="text-xs font-semibold text-[#d04545] transition hover:text-[#a93232] disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              {error && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              <p className="mt-2 text-[11px] leading-4 text-[#7b877f]">
                {busy ? "Saving..." : "Saved to your account: it shows on every device."}
              </p>
            </div>
          </div>
        </article>

        <article className={card}>
          <h3 className="text-sm font-semibold text-[#203028]">Account Information</h3>

          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[11px] font-semibold text-[#59645d]">{label}</dt>
                <dd className="mt-1 flex h-9 items-center truncate rounded-lg border border-[#edf2ec] bg-[#f7faf7] px-3 text-sm text-[#203028]">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 text-[11px] text-[#7b877f]">To change your name or e-mail, ask the Dean&apos;s office.</p>
        </article>
      </div>

      <ChangePassword />
    </section>
  );
}
