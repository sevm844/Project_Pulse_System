"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/nav/dashboard.png", href: "/coordinator" },
  { label: "Student Approvals", icon: "/nav/student-approvals.png", href: "/coordinator/student-approvals" },
  { label: "Requirements", icon: "/nav/requirements.png", href: "/coordinator/requirements" },
  { label: "Group Folders", icon: "/nav/projects.png", href: "/coordinator/group-folders" },
  { label: "Collection Tracker", icon: "/nav/collection-tracker.png", href: "/coordinator/collection-tracker" },
  { label: "Archive Records", icon: "/nav/archive-records.png", href: "/coordinator/archive-records" },
  { label: "Messages", icon: "/nav/messages.png", href: "/coordinator/messages" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/coordinator/notifications" },
  { label: "Profile", icon: "/nav/profile.png", href: "/coordinator/profile" },
];

export default function CoordinatorShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Coordinator"
      slug="coordinator"
      navItems={navItems}
      {...props}
    />
  );
}
