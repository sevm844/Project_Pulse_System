"use client";

import RoleShell, {
  type NavEntry,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavEntry[] = [
  { label: "Dashboard", icon: "/nav/dashboard.png", href: "/grammarian" },
  { label: "Review Queue", icon: "/nav/review-queue.png", href: "/grammarian/review-queue" },
  { label: "Submissions", icon: "/nav/requirements.png", children: [
    { label: "Manuscripts", icon: "/nav/manuscript.png", href: "/grammarian/manuscripts" },
    { label: "Certificates", icon: "/nav/certificates.png", href: "/grammarian/certificates" },
    { label: "Forms", icon: "/nav/documents.png", href: "/grammarian/forms" },
  ] },
  { label: "Messages", icon: "/nav/messages.png", href: "/grammarian/messages" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/grammarian/notifications" },
];

export default function GrammarianShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Grammarian"
      slug="grammarian"
      navItems={navItems}
      {...props}
    />
  );
}
