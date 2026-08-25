"use client";

import { useEffect, useMemo, useState } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import {
  getNotificationsForRole,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type StoredNotification,
} from "../../_utils/notificationStorage";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [filter, setFilter] = useState<"All" | "Unread" | "Read">("All");

  useEffect(() => {
    setNotifications(getNotificationsForRole("Student"));
  }, []);

  const visibleNotifications = useMemo(() => {
    if (filter === "Unread") return notifications.filter((item) => !item.read);
    if (filter === "Read") return notifications.filter((item) => item.read);
    return notifications;
  }, [filter, notifications]);

  function refresh() {
    setNotifications(getNotificationsForRole("Student"));
  }

  return (
    <StudentShell title="Notifications">
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#203028]">
              Notifications
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Message alerts, adviser updates, submissions, and defense notices.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              markAllNotificationsAsRead("Student");
              refresh();
            }}
            className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            Mark All Read
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["All", "Unread", "Read"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                filter === item
                  ? "bg-[#123f2b] text-white"
                  : "border border-[#dfe8df] hover:bg-[#f3f7f1]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {visibleNotifications.length === 0 ? (
            <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
              No notifications found.
            </p>
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#203028]">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-[#59645d]">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-[#7b877f]">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationAsRead(notification.id);
                        refresh();
                      }}
                      className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </StudentShell>
  );
}
