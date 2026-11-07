import { apiFetch } from "./api";

export type ApiNotification = {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string | null;
};

export type NotificationFeed = {
  unread_count: number;
  items: ApiNotification[];
};

export const NOTIFICATIONS_CHANGED_EVENT = "project-pulse-notifications-changed";

export function fetchNotifications() {
  return apiFetch<NotificationFeed>("/notifications");
}

// Tells the bell in the header to refresh its count after something was read.
export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function timeAgo(value: string | null) {
  if (!value) return "";

  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)} d ago`;

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}
