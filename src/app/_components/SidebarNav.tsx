"use client";

import Image from "next/image";
import Link from "next/link";

// A link in the sidebar (leaf), and a group: a heading with its links shown under it.
export type NavItem = {
  label: string;
  icon: string;
  href: string;
  // Extra path prefixes that also highlight this item. Defaults to [href].
  matches?: string[];
};

export type NavGroup = {
  label: string;
  icon?: string;
  children: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "children" in entry;

// The dashboard link must match exactly, or it would light up on every page.
function itemActive(item: NavItem, pathname: string, home: string) {
  return (item.matches ?? [item.href]).some((match) => (match === home ? pathname === home : pathname.startsWith(match)));
}

// The sidebar's menu. A group is a small heading with its links always shown underneath (nothing to click open); the heading itself goes nowhere.
export default function SidebarNav({ entries, pathname, home, collapsed }: { entries: NavEntry[]; pathname: string; home: string; slug?: string; collapsed: boolean }) {
  const row = (active: boolean) =>
    `flex w-full items-center rounded-lg transition ${collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2"} ${
      active ? "bg-[#d7f7d8] font-semibold text-[#203028]" : "text-[#59645d] hover:bg-[#edf9e9] hover:text-[#203028]"
    }`;

  const link = (item: NavItem) => (
    <Link key={item.href} href={item.href} title={item.label} className={row(itemActive(item, pathname, home))}>
      <Image src={item.icon} alt="" width={18} height={18} className="opacity-80" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  return (
    <nav className="mt-6 text-[12px]" aria-label="Main menu">
      <div className="space-y-1">
        {entries.map((entry) => {
          if (!isGroup(entry)) return link(entry);

          return (
            <div key={entry.label} role="group" aria-label={entry.label} className="space-y-1 pt-3">
              {collapsed ? <div className="mx-3 border-t border-[#dfe8df]" /> : <p className="px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a958e]">{entry.label}</p>}
              {entry.children.map(link)}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
