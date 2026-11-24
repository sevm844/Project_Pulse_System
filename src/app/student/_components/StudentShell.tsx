"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/nav/dashboard.png", href: "/student" },
  { label: "My Project", icon: "/nav/projects.png", href: "/student/project" },
  { label: "Requirements", icon: "/nav/requirements.png", href: "/student/requirements" },
  { label: "Manuscript", icon: "/nav/manuscript.png", href: "/student/manuscript" },
  { label: "Documents", icon: "/nav/documents.png", href: "/student/documents" },
  { label: "Defense", icon: "/nav/defense.png", href: "/student/defense" },
  { label: "Chat", icon: "/nav/messages.png", href: "/student/chat" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/student/notifications" },
];

export default function StudentShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Student"
      slug="student"
      navItems={navItems}
      {...props}
      hideContentTitle
    />
  );
}
