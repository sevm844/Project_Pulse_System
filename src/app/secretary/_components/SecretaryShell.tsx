"use client";

import RoleShell, {
  type NavEntry,
  type RoleShellProps,
} from "../../_components/RoleShell";

const navItems: NavEntry[] = [
  { label: "Dashboard", icon: "/nav/dashboard.png", href: "/secretary" },
  { label: "Submissions", icon: "/nav/requirements.png", children: [
    { label: "Requirements", icon: "/nav/requirements.png", href: "/secretary/requirements" },
    { label: "Forms", icon: "/nav/documents.png", href: "/secretary/forms" },
  ] },
  { label: "Records", icon: "/nav/archive-records.png", children: [
    { label: "Group Folders", icon: "/nav/projects.png", href: "/secretary/group-folders" },
    { label: "Collection Tracker", icon: "/nav/collection-tracker.png", href: "/secretary/collection-tracker" },
    { label: "Archive Records", icon: "/nav/archive-records.png", href: "/secretary/archive-records" },
  ] },
  { label: "Messages", icon: "/nav/messages.png", href: "/secretary/messages" },
  { label: "Notifications", icon: "/nav/notifications.png", href: "/secretary/notifications" },
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
