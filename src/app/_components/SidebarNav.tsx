"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// A link in the sidebar (leaf), and a parent that opens in place to show its links (group).
export type NavItem = {
  label: string;
  icon: string;
  href: string;
  // Extra path prefixes that also highlight this item. Defaults to [href].
  matches?: string[];
};

export type NavGroup = {
  label: string;
  icon: string;
  children: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "children" in entry;

// The dashboard link must match exactly, or it would light up on every page.
function itemActive(item: NavItem, pathname: string, home: string) {
  return (item.matches ?? [item.href]).some((match) => (match === home ? pathname === home : pathname.startsWith(match)));
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// The sidebar's menu. A parent item (▸) opens and closes its links in place and goes nowhere itself; the group holding the page you are on is always open, and which
// groups you opened is remembered per role in this browser, like the collapsed state of the sidebar.
export default function SidebarNav({ entries, pathname, home, slug, collapsed }: { entries: NavEntry[]; pathname: string; home: string; slug: string; collapsed: boolean }) {
  const storageKey = `project-pulse-${slug}-sidebar-groups`;
  const [opened, setOpened] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");

      return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  });

  // The group of the page you are on opens by itself (also when you arrive from a link or a notice).
  const activeGroup = entries.find((entry): entry is NavGroup => isGroup(entry) && entry.children.some((child) => itemActive(child, pathname, home)))?.label;

  useEffect(() => {
    if (activeGroup) queueMicrotask(() => setOpened((current) => (current.includes(activeGroup) ? current : [...current, activeGroup])));
  }, [activeGroup]);

  function toggle(label: string) {
    setOpened((current) => {
      const next = current.includes(label) ? current.filter((item) => item !== label) : [...current, label];

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // the sidebar still works without memory
      }

      return next;
    });
  }

  const row = (active: boolean) =>
    `flex w-full items-center rounded-lg transition ${collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2"} ${
      active ? "bg-[#d7f7d8] font-semibold text-[#203028]" : "text-[#59645d] hover:bg-[#edf9e9] hover:text-[#203028]"
    }`;

  return (
    <nav className="mt-6 text-[12px]" aria-label="Main menu">
      <div className="space-y-1">
        {entries.map((entry) => {
          if (!isGroup(entry)) {
            return (
              <Link key={entry.href} href={entry.href} title={entry.label} className={row(itemActive(entry, pathname, home))}>
                <Image src={entry.icon} alt="" width={18} height={18} className="opacity-80" />
                {!collapsed && <span>{entry.label}</span>}
              </Link>
            );
          }

          const open = opened.includes(entry.label);
          const holdsActive = entry.children.some((child) => itemActive(child, pathname, home));

          return (
            <div key={entry.label}>
              <button type="button" onClick={() => toggle(entry.label)} aria-expanded={open} title={entry.label} className={row(holdsActive && !open)}>
                <Image src={entry.icon} alt="" width={18} height={18} className="opacity-80" />
                {!collapsed && (
                  <>
                    <span className={holdsActive ? "font-semibold text-[#203028]" : ""}>{entry.label}</span>
                    <Chevron open={open} />
                  </>
                )}
              </button>

              {open && (
                <ul className={collapsed ? "mt-1 space-y-1" : "ml-[19px] mt-1 space-y-0.5 border-l border-[#dfe8df] pl-2"}>
                  {entry.children.map((child) => (
                    <li key={child.href}>
                      <Link href={child.href} title={child.label} className={`${row(itemActive(child, pathname, home))} ${collapsed ? "" : "py-1.5"}`}>
                        {collapsed ? <Image src={child.icon} alt="" width={16} height={16} className="opacity-80" /> : <span>{child.label}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
