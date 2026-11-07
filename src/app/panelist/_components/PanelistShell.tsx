"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Defenses", icon: "/work.png", href: "/panelist" },
  { label: "Messages", icon: "/chats.png", href: "/panelist/messages" },
  { label: "Notifications", icon: "/notif.png", href: "/panelist/notifications" },
  { label: "Profile", icon: "/profile.png", href: "/panelist/profile" },
];

export default function PanelistShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Panelist"
      slug="panelist"
      navItems={navItems}
      {...props}
    />
  );
}
