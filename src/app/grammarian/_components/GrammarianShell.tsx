"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../_lib/firebase";
import {
  clearStoredUserSession,
  getStoredUserEmail,
} from "../../_utils/authStorage";

export const GRAMMARIAN_PROFILE_IMAGE_KEY =
  "project-pulse-grammarian-profile-image";
export const GRAMMARIAN_PROFILE_IMAGE_UPDATED_EVENT =
  "project-pulse-grammarian-profile-image-updated";

const navItems = [
  ["Dashboard", "/dashbrd.png", "/grammarian"],
  ["Review Queue", "/docs.png", "/grammarian/review-queue"],
  ["Feedback History", "/comment.png", "/grammarian/feedback-history"],
  ["Certificates", "/checklt.png", "/grammarian/certificates"],
  ["Messages", "/chats.png", "/grammarian/messages"],
  ["Notifications", "/notif.png", "/grammarian/notifications"],
  ["Profile", "/profile.png", "/grammarian/profile"],
] as const;

export default function GrammarianShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState("grammarian.office@ub.edu.ph");

  useEffect(() => {
    const role = localStorage.getItem("project-pulse-user-role");

    if (role !== "Grammarian") {
      router.replace("/login");
      return;
    }

    setCheckingAccess(false);
  }, [router]);

  useEffect(() => {
    const savedImage = localStorage.getItem(GRAMMARIAN_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) setProfileImage(savedImage);
    if (savedEmail) setEmail(savedEmail);

    function syncProfileImage(event: Event) {
      setProfileImage((event as CustomEvent<string>).detail || null);
    }

    window.addEventListener(
      GRAMMARIAN_PROFILE_IMAGE_UPDATED_EVENT,
      syncProfileImage,
    );

    return () => {
      window.removeEventListener(
        GRAMMARIAN_PROFILE_IMAGE_UPDATED_EVENT,
        syncProfileImage,
      );
    };
  }, []);

  function handleProfileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setProfileImage(imageData);
      localStorage.setItem(GRAMMARIAN_PROFILE_IMAGE_KEY, imageData);
      window.dispatchEvent(
        new CustomEvent(GRAMMARIAN_PROFILE_IMAGE_UPDATED_EVENT, {
          detail: imageData,
        }),
      );
    };

    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    await signOut(auth);
    clearStoredUserSession();
    router.push("/login");
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#7b877f]">Checking access...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] shrink-0 flex-col justify-between border-r border-[#dfe8df] bg-[linear-gradient(180deg,#ffffff_0%,#fbfef9_42%,#f2fbef_100%)] px-4 py-5 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logotop.png" alt="Project Pulse" width={34} height={34} />
              <div>
                <h1 className="text-sm font-semibold">Project Pulse</h1>
                <p className="text-[11px] text-[#7b877f]">Grammarian Portal</p>
              </div>
            </div>

            <nav className="mt-9 space-y-1 text-sm">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ba69d]">
                Grammarian Menu
              </p>

              {navItems.map(([label, icon, href]) => {
                const isActive =
                  href === "/grammarian"
                    ? pathname === "/grammarian"
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                      isActive
                        ? "bg-[#d7f7d8] font-semibold text-[#203028]"
                        : "text-[#59645d] hover:bg-[#edf9e9] hover:text-[#203028]"
                    }`}
                  >
                    <Image src={icon} alt="" width={16} height={16} className="opacity-70" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#59645d] hover:bg-[#edf9e9]"
          >
            Log out
          </button>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className="relative z-10 flex min-h-screen flex-col">
            <header className="flex flex-col gap-4 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
              <div>
                <p className="text-[11px] font-medium text-[#7b877f]">
                  Grammar Review and Certification
                </p>
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full rounded-lg border border-[#dfe8df] bg-[#f8faf7] px-3 py-2 md:w-72">
                  <input
                    placeholder="Search grammarian workspace..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
                  />
                </div>

                <Link
                  href="/grammarian/notifications"
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                >
                  Notifications
                </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">Grammarian</p>
                    <p className="text-[10px] text-[#7b877f]">{email}</p>
                  </div>

                  <label className="group relative cursor-pointer">
                    <div
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#d7f7d8] bg-cover bg-center text-xs font-semibold text-[#203028]"
                      style={
                        profileImage
                          ? { backgroundImage: `url(${profileImage})` }
                          : undefined
                      }
                    >
                      {!profileImage && "GR"}
                    </div>

                    <span className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/50 text-[9px] text-white group-hover:flex">
                      Edit
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
