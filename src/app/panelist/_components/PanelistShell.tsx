"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Defenses", icon: "/nav/defense.png", href: "/panelist" },
  { label: "Manuscripts", icon: "/nav/manuscript.png", href: "/panelist/manuscripts" },
  { label: "Forms", icon: "/nav/documents.png", href: "/panelist/forms" },
  { label: "Messages", icon: "/nav/messages.png", href: "/panelist/messages" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/panelist/notifications" },
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
