"use client";

import RoleShell, {
  profileImageKeys,
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const keys = profileImageKeys("panelist");
export const PANELIST_PROFILE_IMAGE_KEY = keys.image;
export const PANELIST_PROFILE_IMAGE_UPDATED_EVENT = keys.updatedEvent;

const navItems: NavItem[] = [
  { label: "Defenses", icon: "/work.png", href: "/panelist" },
  { label: "Messages", icon: "/chats.png", href: "/panelist/messages" },
  { label: "Notifications", icon: "/notif.png", href: "/panelist/notifications" },
  { label: "Profile", icon: "/profile.png", href: "/panelist/profile" },
];

export default function PanelistShell(props: RoleShellProps) {
  return (
    <RoleShell
      role="Panelist"
      slug="panelist"
      navItems={navItems}
      {...props}
    />
  );
}
