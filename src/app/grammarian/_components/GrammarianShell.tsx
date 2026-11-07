"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DashboardSearchIcon from "../../_components/DashboardSearchIcon";
import SidebarToggle from "../../_components/SidebarToggle";
import NotificationBell from "../../_components/notifications/NotificationBell";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { logoutFromApi } from "../../_lib/api";
import {
  getStoredUserEmail,
  getStoredUserName,
  initialsOf,
} from "../../_utils/authStorage";

export const GRAMMARIAN_PROFILE_IMAGE_KEY =
  "project-pulse-grammarian-profile-image";
export const GRAMMARIAN_PROFILE_IMAGE_UPDATED_EVENT =
  "project-pulse-grammarian-profile-image-updated";
const GRAMMARIAN_SIDEBAR_COLLAPSED_KEY =
  "project-pulse-grammarian-sidebar-collapsed";

const navItems = [
  ["Dashboard", "/dashbrd.png", "/grammarian"],
  ["Review Queue", "/docs.png", "/grammarian/review-queue"],
  ["Messages", "/chats.png", "/grammarian/messages"],
  ["Notifications", "/notif.png", "/grammarian/notifications"],
  ["Profile", "/profile.png", "/grammarian/profile"],
] as const;

export default function GrammarianShell({
  title,
  subtitle,
  hideContentTitle = false,
  children,
  fitViewport = false,
}: {
  title: string;
  subtitle?: string;
  hideContentTitle?: boolean;
  children: ReactNode;
  fitViewport?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState("grammarian.office@ub.edu.ph");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem(GRAMMARIAN_SIDEBAR_COLLAPSED_KEY) === "true";
  });

  useEffect(() => {
    const role = localStorage.getItem("project-pulse-user-role");

    if (role !== "Grammarian") {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => setCheckingAccess(false));
  }, [router]);

  useEffect(() => {
    const savedImage = localStorage.getItem(GRAMMARIAN_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) queueMicrotask(() => setProfileImage(savedImage));
    if (savedEmail) queueMicrotask(() => setEmail(savedEmail));

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
    await logoutFromApi();
    router.push("/login");
  }

  function toggleSidebar() {
    const nextValue = !sidebarCollapsed;

    setSidebarCollapsed(nextValue);
    localStorage.setItem(GRAMMARIAN_SIDEBAR_COLLAPSED_KEY, String(nextValue));
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#7b877f]">Checking access...</p>
      </main>
    );
  }

  return (
    <main className={`${fitViewport ? "h-dvh" : "h-screen"} overflow-hidden bg-white text-[#1f2a24]`}>
      <div className="flex h-full w-full overflow-hidden bg-white">
        <aside
          className={`relative hidden h-screen shrink-0 flex-col justify-between overflow-visible border-r border-[#dfe8df] bg-[linear-gradient(180deg,#ffffff_0%,#fbfef9_42%,#f2fbef_100%)] px-2 py-5 lg:flex ${
            sidebarCollapsed ? "w-20" : "w-[190px]"
          }`}
        >
          <SidebarToggle
            collapsed={sidebarCollapsed}
            onClick={toggleSidebar}
            variant="panel"
          />
          <div>
            <div
              className={`flex items-center ${
                sidebarCollapsed ? "justify-center" : "gap-2 px-2"
              }`}
            >
              <Image
                src="/logotop.png"
                alt="Project Pulse"
                width={34}
                height={34}
                className="rounded-lg"
              />
              {!sidebarCollapsed && (
                <span className="text-sm font-semibold text-[#203028]">
                  Project Pulse
                </span>
              )}
            </div>

            <nav className="mt-6 text-[12px]">
              <div className="space-y-1">
              {navItems.map(([label, icon, href]) => {
                const isActive =
                  href === "/grammarian"
                    ? pathname === "/grammarian"
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    className={`flex items-center rounded-lg transition ${
                      sidebarCollapsed
                        ? "justify-center px-0 py-2.5"
                        : "gap-2 px-3 py-2"
                    } ${
                      isActive
                        ? "bg-[#d7f7d8] font-semibold text-[#203028]"
                        : "text-[#59645d] hover:bg-[#edf9e9] hover:text-[#203028]"
                    }`}
                  >
                    <Image src={icon} alt="" width={16} height={16} className="opacity-70" />
                    {!sidebarCollapsed && <span>{label}</span>}
                  </Link>
                );
              })}
              </div>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={`mt-auto flex rounded-lg text-xs font-medium text-[#59645d] hover:bg-[#edf9e9] ${
              sidebarCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
            }`}
          >
            {sidebarCollapsed ? "Out" : "Log out"}
          </button>
        </aside>

        <section className="relative h-full min-w-0 flex-1 overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className="relative z-10 flex h-full flex-col">
            <header
              aria-label={`${title} toolbar`}
              className="flex shrink-0 items-center justify-between border-b border-[#edf2ec] px-5 py-4 lg:px-8"
            >
              <div />

              <div className="flex flex-wrap items-center gap-3">
                  <DashboardSearchIcon />

                  <NotificationBell href="/grammarian/notifications" />

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">{getStoredUserName() ?? "Grammarian"}</p>
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
                      {!profileImage && initialsOf(getStoredUserName() ?? "Grammarian")}
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

            <div className={`min-h-0 flex-1 px-5 py-6 lg:px-8 ${fitViewport ? "overflow-hidden" : "overflow-y-auto"}`}>
              {!hideContentTitle && (
                <div className="mb-5">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
