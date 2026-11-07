"use client";

import RoleShell, {
  profileImageKeys,
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const keys = profileImageKeys("student");
export const STUDENT_PROFILE_IMAGE_KEY = keys.image;
export const STUDENT_PROFILE_IMAGE_UPDATED_EVENT = keys.updatedEvent;

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/dashbrd.png", href: "/student" },
  { label: "My Project", icon: "/fold.png", href: "/student/project" },
  { label: "Requirements", icon: "/checklt.png", href: "/student/requirements" },
  { label: "Defense", icon: "/work.png", href: "/student/defense" },
  { label: "Chat", icon: "/chats.png", href: "/student/chat" },
  { label: "Notifications", icon: "/notif.png", href: "/student/notifications" },
  { label: "Profile", icon: "/profile.png", href: "/student/profile" },
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
