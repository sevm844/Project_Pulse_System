"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DashboardSearchIcon from "../../_components/DashboardSearchIcon";
import SidebarToggle from "../../_components/SidebarToggle";
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

export const ADMIN_PROFILE_IMAGE_KEY = "project-pulse-admin-profile-image";
export const ADMIN_PROFILE_IMAGE_UPDATED_EVENT =
  "project-pulse-admin-profile-image-updated";
const ADMIN_SIDEBAR_COLLAPSED_KEY = "project-pulse-admin-sidebar-collapsed";

const navItems = [
  ["Dashboard", "/dashbrd.png", "/admin"],
  ["Users", "/profile.png", "/admin/users"],
  ["Dean Office", "/profile.png", "/admin/dean-office"],
  ["Groups", "/fold.png", "/admin/groups"],
  ["Registration Requests", "/docs.png", "/admin/register-requests"],
  ["Roles & Permissions", "/checklt.png", "/admin/roles"],
  ["Courses & Sections", "/resources.png", "/admin/courses"],
  ["Adviser Assignments", "/work.png", "/admin/advisers"],
  ["Panelist Assignments", "/calendar.png", "/admin/panelists"],
  ["Academic Terms", "/calendar.png", "/admin/terms"],
  ["System Audit Logs", "/docs.png", "/admin/audit-logs"],
  ["Messaging Window", "/chats.png", "/admin/message-settings"],
  ["Notifications", "/notif.png", "/admin/notifications"],
  ["Profile", "/profile.png", "/admin/profile"],
] as const;

const deanAdminNavItems = [
  {
    label: "Dean Dashboard",
    icon: "/dashbrd.png",
    href: "/dean",
    matches: ["/dean"],
  },
  {
    label: "Administration",
    icon: "/profile.png",
    href: "/dean/administration",
    matches: ["/dean/administration"],
  },
  {
    label: "Accounts",
    icon: "/profile.png",
    href: "/dean/administration/users",
    matches: [
      "/dean/administration/users",
      "/dean/administration/register-requests",
      "/dean/administration/roles",
    ],
  },
  {
    label: "Academic Setup",
    icon: "/resources.png",
    href: "/dean/administration/courses",
    matches: [
      "/dean/administration/courses",
      "/dean/administration/groups",
      "/dean/administration/terms",
    ],
  },
  {
    label: "Assignments",
    icon: "/work.png",
    href: "/dean/administration/advisers",
    matches: [
      "/dean/administration/advisers",
      "/dean/administration/panelists",
    ],
  },
  {
    label: "System Control",
    icon: "/docs.png",
    href: "/dean/administration/audit-logs",
    matches: [
      "/dean/administration/audit-logs",
      "/dean/administration/message-settings",
    ],
  },
] as const;

type AdminShellProps = {
  title: string;
  subtitle?: string;
  hideContentTitle?: boolean;
  children: ReactNode;
  fitViewport?: boolean;
};

export default function AdminShell({
  title,
  subtitle = "User and Group Management",
  hideContentTitle = false,
  children,
  fitViewport = false,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDeanAdministration = pathname.startsWith("/dean/administration");
  const activeNavItems = isDeanAdministration
    ? deanAdminNavItems
    : navItems.map(([label, icon, href]) => ({
        label,
        icon,
        href,
        matches: [href],
      }));
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState("admin@ub.edu.ph");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "true";
  });

  useEffect(() => {
    const role = localStorage.getItem("project-pulse-user-role");

    if (role !== "Admin" && !(isDeanAdministration && role === "Dean")) {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => setCheckingAccess(false));
  }, [isDeanAdministration, router]);

  useEffect(() => {
    const savedImage = localStorage.getItem(ADMIN_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) {
      queueMicrotask(() => setProfileImage(savedImage));
    }

    if (savedEmail) {
      queueMicrotask(() => setAdminEmail(savedEmail));
    }

    function syncProfileImage(event: Event) {
      const imageData = (event as CustomEvent<string>).detail;
      setProfileImage(imageData || null);
    }

    window.addEventListener(ADMIN_PROFILE_IMAGE_UPDATED_EVENT, syncProfileImage);

    return () => {
      window.removeEventListener(
        ADMIN_PROFILE_IMAGE_UPDATED_EVENT,
        syncProfileImage,
      );
    };
  }, []);

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setProfileImage(imageData);
      localStorage.setItem(ADMIN_PROFILE_IMAGE_KEY, imageData);
      window.dispatchEvent(
        new CustomEvent(ADMIN_PROFILE_IMAGE_UPDATED_EVENT, {
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

  function toggleSidebar() {
    const nextValue = !sidebarCollapsed;

    setSidebarCollapsed(nextValue);
    localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(nextValue));
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#7b877f]">Checking access...</p>
      </main>
    );
  }

  return (
    <main className={`${fitViewport ? "h-dvh overflow-hidden" : "min-h-screen"} bg-white text-[#1f2a24]`}>
      <div className={`flex ${fitViewport ? "h-full overflow-hidden" : "min-h-screen"}`}>
        <aside
          className={`relative hidden shrink-0 flex-col justify-between border-r border-[#dfe8df] bg-[linear-gradient(180deg,#ffffff_0%,#fbfef9_42%,#f2fbef_100%)] px-4 py-5 lg:flex ${
            sidebarCollapsed ? "w-20" : "w-[270px]"
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

            <nav className="mt-9 text-sm">
              <div className="space-y-1">
              {activeNavItems.map(({ label, icon, href, matches }) => {
                const isActive = matches.some((match) =>
                  match === "/admin" ||
                  match === "/dean" ||
                  match === "/dean/administration"
                    ? pathname === match
                    : pathname.startsWith(match),
                );

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
                        : "text-[#59645d] hover:bg-[#edf9e9] hover:text-[#203028]"
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

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={`flex rounded-lg text-xs font-medium text-[#59645d] hover:bg-[#edf9e9] ${
              sidebarCollapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"
            }`}
          >
            {sidebarCollapsed ? "Out" : "Log out"}
          </button>
        </aside>

        <section className="relative min-w-0 flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className={`relative z-10 flex flex-col ${fitViewport ? "h-full min-h-0" : "min-h-screen"}`}>
            <header className="flex shrink-0 flex-col gap-4 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
              <div />

              <div className="flex flex-wrap items-center gap-3">
                  <DashboardSearchIcon />

                  <Link
                    href={
                      isDeanAdministration
                        ? "/dean/notifications"
                        : "/admin/notifications"
                    }
                    aria-label="Notifications"
                    title="Notifications"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe8df] bg-white transition hover:bg-[#f3f7f1]"
                  >
                    <Image src="/notif.png" alt="" width={18} height={18} />
                  </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">
                      {isDeanAdministration ? "Dean Office" : "Admin"}
                    </p>
                    <p className="text-[10px] text-[#7b877f]">{adminEmail}</p>
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
                      {!profileImage && "AD"}
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
                  <p className="text-[11px] font-medium text-[#7b877f]">
                    {subtitle}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#203028]">
                    {title}
                  </h1>
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
