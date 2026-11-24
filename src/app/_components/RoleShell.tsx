"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, toAppRole } from "../_lib/api";
import { requestLogout } from "./SessionGuard";
import { roleHomePath } from "../_lib/roleHome";
import type { UserRole } from "../_lib/types";
import {
  getStoredUserEmail,
  getStoredUserName,
  getStoredUserRole,
  getStoredUserRoles,
  saveStoredUserSession,
  getStoredUserUid,
  initialsOf,
} from "../_utils/authStorage";
import DashboardSearchIcon from "./DashboardSearchIcon";
import FeedbackDialog from "./feedback/FeedbackDialog";
import NotificationBell from "./notifications/NotificationBell";
import ProfileMenu from "./ProfileMenu";
import ProfileSwitcher from "./ProfileSwitcher";
import SidebarNav, { type NavEntry } from "./SidebarNav";
import SidebarToggle from "./SidebarToggle";
import { useProfilePhoto } from "./useProfilePhoto";

// The menu types live with the menu itself (a link, or a parent that opens in place to show its links).
export type { NavEntry, NavGroup, NavItem } from "./SidebarNav";

export type RoleShellProps = {
  title: string;
  subtitle?: string;
  hideContentTitle?: boolean;
  fitViewport?: boolean;
  children: ReactNode;
};

type Props = RoleShellProps & {
  role: UserRole;
  // Lowercase route/segment name, e.g. "adviser" for /adviser/...
  slug: string;
  navItems: NavEntry[];
};

export default function RoleShell({
  role,
  slug,
  navItems,
  title,
  subtitle,
  hideContentTitle = false,
  fitViewport = false,
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsedKey = `project-pulse-${slug}-sidebar-collapsed`;
  const home = `/${slug}`;

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [heldRoles, setHeldRoles] = useState<UserRole[]>(() => getStoredUserRoles());
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { photo: profileImage } = useProfilePhoto(slug);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem(collapsedKey) === "true";
  });

  useEffect(() => {
    if (getStoredUserRole() !== role) {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => setCheckingAccess(false));

    // The Dean may have added or taken away one of this person's roles since they signed in: ask the server what they hold now.
    void apiFetch<{ role: string; roles?: string[] }>("/me")
      .then((me) => {
        const current = toAppRole(me.role);
        const roles = (me.roles ?? [me.role]).map(toAppRole);

        saveStoredUserSession({
          uid: getStoredUserUid() ?? "",
          email: getStoredUserEmail() ?? "",
          name: getStoredUserName() ?? undefined,
          role: current,
          roles,
        });
        setHeldRoles(roles);

        // The profile in use was taken away: continue as the main role.
        if (current !== role) window.location.assign(roleHomePath(current));
      })
      .catch(() => {
        // Offline or signed out: the normal API handling deals with it; keep what is stored.
      });
  }, [role, router]);

  function toggleSidebar() {
    const nextValue = !sidebarCollapsed;

    setSidebarCollapsed(nextValue);
    localStorage.setItem(collapsedKey, String(nextValue));
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-[#1f2a24]">
        <p className="text-sm text-[#7b877f]">Checking access...</p>
      </main>
    );
  }

  const displayName = getStoredUserName() ?? role;
  const displayEmail = getStoredUserEmail() ?? "";

  return (
    <main className={`${fitViewport ? "h-dvh" : "h-screen"} overflow-hidden bg-white text-[#1f2a24]`}>
      <div className="flex h-full w-full overflow-hidden bg-white">
        <aside
          className={`relative hidden h-screen shrink-0 flex-col justify-between overflow-visible border-r border-[#dfe8df] bg-[linear-gradient(180deg,#ffffff_0%,#fbfef9_42%,#f2fbef_100%)] px-2 py-5 lg:flex ${
            sidebarCollapsed ? "w-20" : "w-[200px]"
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
                <span className="text-[14px] font-bold text-[#203028]">
                  Project Pulse
                </span>
              )}
            </div>

            <SidebarNav entries={navItems} pathname={pathname} home={home} slug={slug} collapsed={sidebarCollapsed} />
          </div>

          <button
            type="button"
            onClick={requestLogout}
            title="Log out"
            className={`mt-auto flex w-full items-center rounded-lg text-[12px] font-semibold text-[#4d5751] transition hover:bg-[#edf9e9] hover:text-[#203028] ${
              sidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
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
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs font-semibold text-[#59645d] transition hover:bg-[#f3f7f1]"
                >
                  Feedback
                </button>

                <DashboardSearchIcon />

                <NotificationBell href={`${home}/notifications`} />

                <div className="flex items-center gap-2 pl-1">
                  <ProfileSwitcher name={displayName} email={displayEmail} image={profileImage} roles={heldRoles} />

                  <ProfileMenu name={displayName} email={displayEmail} image={profileImage} initials={initialsOf(displayName)} settingsHref={`${home}/profile`} />
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

      {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} />}
    </main>
  );
}
