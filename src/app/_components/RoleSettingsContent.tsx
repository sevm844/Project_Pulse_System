"use client";

import Image from "next/image";
import type { ChangeEvent } from "react";

export type RoleSettingsUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  location: string;
  avatarSrc: string;
};

type RoleSettingsContentProps = {
  user: RoleSettingsUser;
  onFieldChange?: (
    field: keyof Omit<RoleSettingsUser, "avatarSrc">,
    value: string,
  ) => void;
  onAvatarUpload?: (event: ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove?: () => void;
  onSave?: () => void;
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none transition placeholder:text-[#a0aaa3] focus:border-[#49a95a] focus:ring-2 focus:ring-[#d7f7d8]";

export default function RoleSettingsContent({
  user,
  onFieldChange,
  onAvatarUpload,
  onAvatarRemove,
  onSave,
}: RoleSettingsContentProps) {
  const fullWidthFields = [
    ["email", "E-mail", user.email],
    ["role", "Role", user.role],
    ["location", "Location", user.location],
  ] as const;

  return (
    <section className="rounded-2xl border border-[#dfe8df] bg-[#fbfdfb] px-5 py-5 shadow-[0_18px_50px_rgba(32,48,40,0.06)] md:px-8 md:py-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#203028]">
            Settings
          </h2>
          <p className="mt-2 text-sm text-[#59645d]">
            Manage your account information and preferences
          </p>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="h-11 rounded-full bg-[#49a95a] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(73,169,90,0.24)] transition hover:bg-[#3f964f] md:self-start"
        >
          Save all changes
        </button>
      </div>

      <nav className="mt-6 border-b border-[#e2ebe1]" aria-label="Settings">
        <button
          type="button"
          className="-mb-px border-b-2 border-[#203028] px-1 pb-3 text-xs font-semibold text-[#203028]"
        >
          Profile
        </button>
      </nav>

      <div className="mt-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <article className="rounded-lg border border-[#edf2ec] bg-white p-5 shadow-[0_16px_45px_rgba(32,48,40,0.04)]">
          <h3 className="text-base font-semibold text-[#203028]">
            Profile Picture
          </h3>

          <div className="mt-8 flex flex-col items-center">
            <Image
              src={user.avatarSrc}
              alt="Profile"
              width={116}
              height={116}
              unoptimized={user.avatarSrc.startsWith("data:")}
              className="h-[116px] w-[116px] rounded-full object-cover"
            />

            <label className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[#49a95a] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(73,169,90,0.22)] transition hover:bg-[#3f964f]">
              Upload a new one
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onAvatarRemove}
              className="mt-4 text-sm font-semibold text-[#d04545] transition hover:text-[#a93232]"
            >
              Remove photo
            </button>
          </div>
        </article>

        <article className="rounded-lg border border-[#edf2ec] bg-white p-5 shadow-[0_16px_45px_rgba(32,48,40,0.04)]">
          <h3 className="text-base font-semibold text-[#203028]">
            Basic Information
          </h3>

          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs font-semibold text-[#203028]">
                First name
                <input
                  value={user.firstName}
                  onChange={(event) =>
                    onFieldChange?.("firstName", event.target.value)
                  }
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-[#203028]">
                Last name
                <input
                  value={user.lastName}
                  onChange={(event) =>
                    onFieldChange?.("lastName", event.target.value)
                  }
                  className={inputClass}
                />
              </label>
            </div>

            {fullWidthFields.map(([field, label, value]) => (
              <label
                key={field}
                className="text-xs font-semibold text-[#203028]"
              >
                {label}
                <input
                  value={value}
                  onChange={(event) => onFieldChange?.(field, event.target.value)}
                  className={inputClass}
                />
              </label>
            ))}
          </form>
        </article>
      </div>
    </section>
  );
}
