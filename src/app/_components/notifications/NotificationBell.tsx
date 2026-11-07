"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredToken } from "../../_utils/authStorage";
import { fetchNotifications, NOTIFICATIONS_CHANGED_EVENT } from "../../_lib/notifications";

// The header bell: opens the notifications page and shows how many are unread.
export default function NotificationBell({ href }: { href: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    async function refresh() {
      if (!getStoredToken()) return;

      try {
        const feed = await fetchNotifications();
        if (active) setUnread(feed.unread_count);
      } catch {
        // The bell is only a hint. A failed refresh must never disturb the page.
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, []);

  return (
    <Link
      href={href}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      title="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe8df] bg-white transition hover:bg-[#f3f7f1]"
    >
      <Image src="/notif.png" alt="" width={18} height={18} />

      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#123f2b] px-1 text-[9px] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
