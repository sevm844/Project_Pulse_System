"use client";

import RoleShell, {
  profileImageKeys,
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const keys = profileImageKeys("dean");
export const DEAN_PROFILE_IMAGE_KEY = keys.image;
export const DEAN_PROFILE_IMAGE_UPDATED_EVENT = keys.updatedEvent;

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/dashbrd.png", href: "/dean" },
  { label: "Projects", icon: "/fold.png", href: "/dean/projects", matches: ["/dean/projects", "/dean/assigned-groups"] },
  { label: "Defenses", icon: "/work.png", href: "/dean/defense" },
  { label: "Requirements", icon: "/docs.png", href: "/dean/requirements" },
  { label: "Administration", icon: "/profile.png", href: "/dean/administration" },
  { label: "Reports", icon: "/docs.png", href: "/dean/reports" },
  { label: "Messages", icon: "/chats.png", href: "/dean/messages" },
  { label: "Profile", icon: "/profile.png", href: "/dean/profile", matches: ["/dean/profile", "/dean/notifications"] },
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
