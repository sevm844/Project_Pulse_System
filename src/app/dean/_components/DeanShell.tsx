"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/nav/dashboard.png", href: "/dean" },
  { label: "Projects", icon: "/nav/projects.png", href: "/dean/projects", matches: ["/dean/projects", "/dean/assigned-groups"] },
  { label: "Defenses", icon: "/nav/defense.png", href: "/dean/defense" },
  { label: "Requirements", icon: "/nav/requirements.png", href: "/dean/requirements" },
  { label: "Documents", icon: "/nav/documents.png", href: "/dean/documents" },
  { label: "Manuscripts", icon: "/nav/manuscript.png", href: "/dean/manuscripts" },
  { label: "Certificates", icon: "/nav/certificates.png", href: "/dean/certificates" },
  { label: "Administration", icon: "/nav/administration.png", href: "/dean/administration" },
  { label: "Reports", icon: "/nav/reports.png", href: "/dean/reports" },
  { label: "Feedback", icon: "/nav/feedback.png", href: "/dean/feedback" },
  { label: "Messages", icon: "/nav/messages.png", href: "/dean/messages" },
];

export default function DeanShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Dean"
      slug="dean"
      navItems={navItems}
      {...props}
      hideContentTitle
    />
  );
}
