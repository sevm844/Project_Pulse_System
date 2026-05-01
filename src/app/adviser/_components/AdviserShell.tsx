"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

const ADVISER_PROFILE_IMAGE_KEY = "project-pulse-adviser-profile-image";
const ADVISER_SIDEBAR_COLLAPSED_KEY =
  "project-pulse-adviser-sidebar-collapsed";

const navItems = [
  ["Dashboard", "/dashbrd.png", "/adviser"],
  ["Assigned Groups", "/fold.png", "/adviser/assigned-groups"],
  ["Reviews", "/docs.png", "/adviser/reviews"],
  ["Feedback Queue", "/comment.png", "/adviser/feedback-queue"],
  ["Defense", "/work.png", "/adviser/defense"],
  ["Messages", "/chats.png", "/adviser/messages"],
  ["Schedule", "/calendar.png", "/adviser/schedule"],
  ["Notifications", "/notif.png", "/adviser/notifications"],
] as const;

type AdviserShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AdviserShell({
  title,
  subtitle = "Adviser Workspace",
  children,
}: AdviserShellProps) {
  const pathname = usePathname();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem(ADVISER_SIDEBAR_COLLAPSED_KEY) === "true";
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const savedImage = localStorage.getItem(ADVISER_PROFILE_IMAGE_KEY);
    if (savedImage) setProfileImage(savedImage);
  }, []);

  function toggleSidebar() {
    const nextValue = !sidebarCollapsed;

    setSidebarCollapsed(nextValue);
    localStorage.setItem(ADVISER_SIDEBAR_COLLAPSED_KEY, String(nextValue));
  }

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setProfileImage(imageData);
      localStorage.setItem(ADVISER_PROFILE_IMAGE_KEY, imageData);
    };

    reader.readAsDataURL(file);
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <div className="flex min-h-screen w-full overflow-hidden bg-white">
        {/* Sidebar */}
        <aside
          className={`hidden shrink-0 flex-col justify-between border-r border-[#dfe8df] bg-white/[0.88] px-4 py-5 lg:flex ${
            sidebarCollapsed ? "w-20" : "w-[260px]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/logotop.png"
                  alt="Project Pulse"
                  width={34}
                  height={34}
                  className="rounded-xl"
                />

                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <h1 className="truncate text-sm font-semibold tracking-tight">
                      Project Pulse
                    </h1>
                    <p className="truncate text-[11px] text-[#7b877f]">
                      Adviser Portal
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleSidebar}
                className="rounded-full border border-[#dfe8df] bg-white px-2 py-1 text-xs font-medium text-[#7b877f] transition hover:bg-[#f3f7f1]"
              >
                {sidebarCollapsed ? ">" : "<"}
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-9 text-sm">
              {!sidebarCollapsed && (
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ba69d]">
                  Adviser Sidebar
                </p>
              )}

              <div className="space-y-1">
                {navItems.map(([label, icon, href]) => {
                  const isActive =
                    href === "/adviser"
                      ? pathname === "/adviser"
                      : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      title={label}
                      className={`flex items-center rounded-lg transition ${
                        sidebarCollapsed
                          ? "justify-center px-0 py-3"
                          : "gap-3 px-3 py-2.5"
                      } ${
                        isActive
                          ? "bg-[#d7f7d8] font-semibold text-[#203028]"
                          : "text-[#59645d] hover:bg-[#f3f7f1] hover:text-[#203028]"
                      }`}
                    >
                      <Image
                        src={icon}
                        alt=""
                        width={16}
                        height={16}
                        className="opacity-70"
                      />

                      {!sidebarCollapsed && <span>{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          <Link
            href="/login"
            title="Log out"
            className={`flex rounded-lg text-xs font-medium text-[#59645d] transition hover:bg-[#f3f7f1] ${
              sidebarCollapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"
            }`}
          >
            {sidebarCollapsed ? "Out" : "Log out"}
          </Link>
        </aside>

        {/* Main workspace */}
        <section className="relative flex-1 overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className="relative z-10 flex min-h-screen flex-col">
            <header className="flex flex-col gap-4 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
              <div>
                <p className="text-[11px] font-medium text-[#7b877f]">
                  {subtitle}
                </p>
                <h1 className="text-xl font-semibold tracking-tight">
                  {title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full rounded-lg border border-[#dfe8df] bg-[#f8faf7] px-3 py-2 md:w-72">
                  <input
                    placeholder="Search adviser workspace..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
                  />
                </div>

                <Link
                  href="/adviser/notifications"
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                >
                  Notifications
                </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">Anna Cruz</p>
                    <p className="text-[10px] text-[#7b877f]">
                      anna.cruz@ub.edu.ph
                    </p>
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
                      {!profileImage && "AC"}
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
