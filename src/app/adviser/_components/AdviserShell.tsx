"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/dashbrd.png", href: "/adviser" },
  { label: "Assigned Groups", icon: "/fold.png", href: "/adviser/assigned-groups" },
  { label: "Requirements", icon: "/checklt.png", href: "/adviser/requirements" },
  { label: "Documents", icon: "/docs.png", href: "/adviser/documents" },
  { label: "Defense", icon: "/work.png", href: "/adviser/defense" },
  { label: "Messages", icon: "/chats.png", href: "/adviser/messages" },
  { label: "Notifications", icon: "/notif.png", href: "/adviser/notifications" },
  { label: "Profile", icon: "/profile.png", href: "/adviser/profile" },
];

export default function AdviserShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Adviser"
      slug="adviser"
      navItems={navItems}
      {...props}
    />
  );
}
