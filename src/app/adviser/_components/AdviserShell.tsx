"use client";

import RoleShell, {
  type NavEntry,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavEntry[] = [
  { label: "Dashboard", icon: "/nav/dashboard.png", href: "/adviser" },
  { label: "Assigned Groups", icon: "/nav/projects.png", href: "/adviser/assigned-groups" },
  { label: "Submissions", icon: "/nav/requirements.png", children: [
    { label: "Requirements", icon: "/nav/requirements.png", href: "/adviser/requirements" },
    { label: "Documents", icon: "/nav/documents.png", href: "/adviser/documents" },
    { label: "Manuscripts", icon: "/nav/manuscript.png", href: "/adviser/manuscripts" },
  ] },
  { label: "Defense", icon: "/nav/defense.png", href: "/adviser/defense" },
  { label: "Messages", icon: "/nav/messages.png", href: "/adviser/messages" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/adviser/notifications" },
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
