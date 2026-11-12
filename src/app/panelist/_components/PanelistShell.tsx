"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Defenses", icon: "/nav/defense.png", href: "/panelist" },
  { label: "Messages", icon: "/nav/messages.png", href: "/panelist/messages" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/panelist/notifications" },
  { label: "Profile", icon: "/nav/profile.png", href: "/panelist/profile" },
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
