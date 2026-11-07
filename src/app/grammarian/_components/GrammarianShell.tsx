"use client";

import RoleShell, {
  profileImageKeys,
  type NavItem,
  type RoleShellProps,
} from "../../_components/RoleShell";

const keys = profileImageKeys("grammarian");
export const GRAMMARIAN_PROFILE_IMAGE_KEY = keys.image;
export const GRAMMARIAN_PROFILE_IMAGE_UPDATED_EVENT = keys.updatedEvent;

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "/dashbrd.png", href: "/grammarian" },
  { label: "Review Queue", icon: "/docs.png", href: "/grammarian/review-queue" },
  { label: "Messages", icon: "/chats.png", href: "/grammarian/messages" },
  { label: "Notifications", icon: "/notif.png", href: "/grammarian/notifications" },
  { label: "Profile", icon: "/profile.png", href: "/grammarian/profile" },
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
