"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ChangeEvent, type ReactNode } from "react";

const navItems = [
  ["Dashboard", "/dashbrd.png", "/student"],
  ["My Project", "/fold.png", "/student/project"],
  ["Documents", "/docs.png", "/student/documents"],
  ["Feedback", "/comment.png", "/student/feedback"],
  ["Tasks / Checklist", "/checklt.png", "/student/checklist"],
  ["Defense", "/work.png", "/student/defense"],
  ["Chat", "/chats.png", "/student/chat"],
  ["Notifications", "/notif.png", "/student/notifications"],
  ["Resources", "/resources.png", "/student/resources"],
  ["Profile / Group Members", "/profile.png", "/student/profile"],
];

export default function StudentShell({
  title,
  subtitle = "Student Management",
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileImage, setProfileImage] = useState("/default-avatar.png");

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <div className="flex min-h-screen w-full overflow-hidden bg-white">
        <aside
          className={`hidden shrink-0 flex-col justify-between border-r border-[#dfe8df] bg-white/[0.86] px-4 py-5 transition-all duration-300 lg:flex ${
            sidebarCollapsed ? "w-20" : "w-[260px]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/logotop.png"
                  alt="Logo"
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
                      Student Workspace
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="rounded-full border border-[#dfe8df] bg-white px-2 py-1 text-xs font-medium text-[#7b877f] transition hover:bg-[#f3f7f1]"
              >
                {sidebarCollapsed ? ">" : "<"}
              </button>
            </div>

            <nav className="mt-9 text-sm">
              {!sidebarCollapsed && (
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ba69d]">
                  Student Main Sidebar
                </p>
              )}

              <div className="space-y-1">
                {navItems.map(([label, icon, href]) => {
                  const isActive =
                    href === "/student"
                      ? pathname === "/student"
                      : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      title={label}
                      className={`flex w-full items-center rounded-lg text-left transition ${
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

          <div className="space-y-3">
  <Link
    href="/login"
    title="Log out"
    className={`flex rounded-lg text-xs font-medium text-[#59645d] transition hover:bg-[#f3f7f1] ${
      sidebarCollapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"
    }`}
  >
    {sidebarCollapsed ? "Out" : "Log out"}
  </Link>
</div>

        </aside>

        <section className="relative flex-1 overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />

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
                    placeholder="Search workspace..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
                  />
                </div>

                <Link
                  href="/student/notifications"
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] transition hover:bg-[#f3f7f1]"
                >
                  Notifications
                </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">Student Name</p>
                    <p className="text-[10px] text-[#7b877f]">
                      1234567@ub.edu.ph
                    </p>
                  </div>
                  <label className="group relative cursor-pointer">
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={34}
                      height={34}
                      className="h-[34px] w-[34px] rounded-full object-cover"
                    />
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
