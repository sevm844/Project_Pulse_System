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

  return (
    <section className="rounded-2xl border border-[#dfe8df] bg-[#fbfdfb] px-5 py-5 shadow-[0_18px_50px_rgba(32,48,40,0.06)] md:px-8 md:py-7">
      <h2 className="text-xl font-semibold tracking-tight text-[#203028]">
        Profile
      </h2>
      <p className="mt-2 text-sm text-[#59645d]">
        Your account information and profile picture
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <article className="rounded-lg border border-[#edf2ec] bg-white p-5">
          <h3 className="text-base font-semibold text-[#203028]">
            Profile Picture
          </h3>

          <div className="mt-8 flex flex-col items-center">
            <Image
              src={avatar}
              alt="Profile"
              width={116}
              height={116}
              unoptimized={avatar.startsWith("data:") || avatar.endsWith(".svg")}
              className="h-[116px] w-[116px] rounded-full object-cover"
            />

            <label className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[#123f2b] px-5 text-sm font-semibold text-white transition hover:bg-[#0f3324]">
              Upload a new one
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={changePhoto}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy || !photo}
              className="mt-4 text-sm font-semibold text-[#d04545] transition hover:text-[#a93232] disabled:opacity-40"
            >
              Remove photo
            </button>

            {error && (
              <p role="alert" className="mt-3 text-center text-xs text-red-600">
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-[11px] text-[#7b877f]">
              {busy ? "Saving..." : "Saved to your account: it shows on every device you sign in from."}
            </p>
          </div>
        </article>

        <article className="rounded-lg border border-[#edf2ec] bg-white p-5">
          <h3 className="text-base font-semibold text-[#203028]">
            Account Information
          </h3>

          <dl className="mt-6 grid gap-4">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold text-[#203028]">{label}</dt>
                <dd className="mt-2 flex h-11 items-center rounded-lg border border-[#edf2ec] bg-[#f7faf7] px-3 text-sm text-[#203028]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-xs text-[#7b877f]">
            To change your name or e-mail, ask the Dean&apos;s office. Your password is yours alone: change it below.
          </p>
        </article>
      </div>

      <ChangePassword />
    </section>
  );
}
