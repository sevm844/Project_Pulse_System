"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";
import Card from "../_components/Card";
import {
  deleteNotification,
  getNotificationsForRole,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type StoredNotification,
} from "../../_utils/notificationStorage";

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function categoryClasses(category: StoredNotification["category"]) {
  if (category === "Defense") return "bg-amber-50 text-amber-700";
  if (category === "Feedback") return "bg-orange-50 text-orange-700";
  if (category === "Document") return "bg-blue-50 text-blue-700";
  if (category === "Approval") return "bg-emerald-50 text-emerald-700";
  if (category === "Requirement") return "bg-purple-50 text-purple-700";
  if (category === "Message") return "bg-sky-50 text-sky-700";

  return "bg-[#f3f7f1] text-[#59645d]";
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [filter, setFilter] = useState<"All" | "Unread" | "Read">("All");

  useEffect(() => {
    setNotifications(getNotificationsForRole("Admin"));
  }, []);

  const visibleNotifications = useMemo(() => {
    if (filter === "Unread") {
      return notifications.filter((notification) => !notification.read);
    }

    if (filter === "Read") {
      return notifications.filter((notification) => notification.read);
    }

    return notifications;
  }, [filter, notifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  function handleMarkRead(id: number) {
    markNotificationAsRead(id);
    setNotifications(getNotificationsForRole("Admin"));
  }

  function handleMarkAllRead() {
    markAllNotificationsAsRead("Admin");
    setNotifications(getNotificationsForRole("Admin"));
  }

  function handleDelete(id: number) {
    deleteNotification(id);
    setNotifications(getNotificationsForRole("Admin"));
  }

  return (
    <AdminShell title="Notifications">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                System alerts for group registrations, workflow updates,
                defense activity, and user management.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
            >
              Mark All as Read
            </button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Total Notifications", notifications.length],
            ["Unread", unreadCount],
            ["Read", notifications.length - unreadCount],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#203028]">
                {value}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="flex flex-wrap gap-2">
            {(["All", "Unread", "Read"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  filter === item
                    ? "bg-[#202823] text-white"
                    : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {visibleNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#dfe8df] bg-[#fbfdfb] px-5 py-8 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No notifications found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try another filter or wait for new system activity.
                </p>
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-4 ${
                    notification.read
                      ? "border-[#edf2ec] bg-white"
                      : "border-[#d7f7d8] bg-[#fbfffb]"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${categoryClasses(
                            notification.category,
                          )}`}
                        >
                          {notification.category}
                        </span>

                        {!notification.read && (
                          <span className="rounded-full bg-[#202823] px-2.5 py-1 text-[10px] font-semibold text-white">
                            New
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-sm font-semibold text-[#203028]">
                        {notification.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[#59645d]">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-[#7b877f]">
                        {formatNotificationDate(notification.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {notification.href && (
                        <Link
                          href={notification.href}
                          className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Open
                        </Link>
                      )}

                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification.id)}
                          className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Mark Read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
