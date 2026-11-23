"use client";

import RoleShell, {
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/nav/dashboard.png", href: "/secretary" },
  { label: "Requirements", icon: "/nav/requirements.png", href: "/secretary/requirements" },
  { label: "Group Folders", icon: "/nav/projects.png", href: "/secretary/group-folders" },
  { label: "Collection Tracker", icon: "/nav/collection-tracker.png", href: "/secretary/collection-tracker" },
  { label: "Archive Records", icon: "/nav/archive-records.png", href: "/secretary/archive-records" },
  { label: "Forms", icon: "/nav/documents.png", href: "/secretary/forms" },
  { label: "Messages", icon: "/nav/messages.png", href: "/secretary/messages" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/secretary/notifications" },
  { label: "Profile", icon: "/nav/profile.png", href: "/secretary/profile" },
];

export default function SecretaryShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Secretary"
      slug="secretary"
      navItems={navItems}
      {...props}
    />
  );
}
