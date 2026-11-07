"use client";

import RoleShell, {
  profileImageKeys,
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const keys = profileImageKeys("coordinator");
export const COORDINATOR_PROFILE_IMAGE_KEY = keys.image;
export const COORDINATOR_PROFILE_IMAGE_UPDATED_EVENT = keys.updatedEvent;

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/dashbrd.png", href: "/coordinator" },
  { label: "Student Approvals", icon: "/profile.png", href: "/coordinator/student-approvals" },
  { label: "Requirements", icon: "/docs.png", href: "/coordinator/requirements" },
  { label: "Group Folders", icon: "/fold.png", href: "/coordinator/group-folders" },
  { label: "Collection Tracker", icon: "/checklt.png", href: "/coordinator/collection-tracker" },
  { label: "Archive Records", icon: "/resources.png", href: "/coordinator/archive-records" },
  { label: "Messages", icon: "/chats.png", href: "/coordinator/messages" },
  { label: "Notifications", icon: "/notif.png", href: "/coordinator/notifications" },
  { label: "Profile", icon: "/profile.png", href: "/coordinator/profile" },
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
