"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import {
  announceNotificationsChanged,
  fetchNotifications,
  timeAgo,
  type ApiNotification,
} from "../../_lib/notifications";

// The same quiet list for every role: newest first, unread marked with a dot.
export default function NotificationsFeed() {
  const router = useRouter();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems((await fetchNotifications()).items);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load your notifications."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function open(item: ApiNotification) {
    if (!item.is_read) {
      try {
        await apiFetch(`/notifications/${item.notification_id}/read`, { method: "PUT" });
        setItems((current) =>
          current.map((entry) =>
            entry.notification_id === item.notification_id ? { ...entry, is_read: true } : entry,
          ),
        );
        announceNotificationsChanged();
      } catch {
        // Opening the page still works if marking it read failed.
      }
    }

    if (item.link) router.push(item.link);
  }

  async function markAllRead() {
    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
      setItems((current) => current.map((entry) => ({ ...entry, is_read: true })));
      announceNotificationsChanged();
    } catch (err) {
      setError(errorMessage(err, "Unable to mark them as read."));
    }
  }

  const unread = items.filter((item) => !item.is_read).length;
  const visible = filter === "unread" ? items.filter((item) => !item.is_read) : items;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf2ec] pb-3 text-xs font-semibold">
        <div className="flex gap-5">
          {(
            [
              ["all", "All"],
              ["unread", `Unread (${unread})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`-mb-[13px] border-b-2 pb-3 ${
                filter === key ? "border-[#123f2b] text-[#203028]" : "border-transparent text-[#9aa59e] hover:text-[#59645d]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unread === 0}
          className="text-[#4f8f58] hover:underline disabled:opacity-40 disabled:no-underline"
        >
          Mark all as read
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

      {!loading && visible.length === 0 && !error && (
        <p className="mt-12 text-center text-sm text-[#9aa59e]">
          {filter === "unread" ? "No unread notifications." : "You are all caught up."}
        </p>
      )}

      <ul className="divide-y divide-[#edf2ec]">
        {visible.map((item) => (
          <li key={item.notification_id}>
            <button
              type="button"
              onClick={() => void open(item)}
              className="flex w-full items-start gap-3 py-4 text-left transition hover:bg-[#fbfdfb]"
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.is_read ? "bg-transparent" : "bg-emerald-500"}`}
              />

              <span className="min-w-0 flex-1">
                <span className={`block text-sm text-[#203028] ${item.is_read ? "font-medium" : "font-semibold"}`}>
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#7b877f]">{item.message}</span>
              </span>

              <span className="shrink-0 pt-0.5 text-[11px] text-[#9aa59e]">{timeAgo(item.created_at)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
