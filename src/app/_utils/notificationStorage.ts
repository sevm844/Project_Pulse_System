export type NotificationRole =
  | "Student"
  | "Adviser"
  | "Dean"
  | "Admin"
  | "Coordinator"
  | "Panelist"
  | "Grammarian"
  | "Records Staff";

export type StoredNotification = {
  id: number;
  role: NotificationRole;
  title: string;
  message: string;
  category:
    | "Message"
    | "Feedback"
    | "Document"
    | "Defense"
    | "System"
    | "Requirement"
    | "Approval";
  href?: string;
  createdAt: string;
  read: boolean;
};

const NOTIFICATION_STORAGE_KEY = "project-pulse-notifications";

const defaultNotifications: StoredNotification[] = [
  {
    id: 1,
    role: "Dean",
    title: "New group registration",
    message: "Project Pulse submitted a group registration request.",
    category: "System",
    href: "/dean/administration/register-requests",
    createdAt: "2026-05-10T08:00:00.000Z",
    read: false,
  },
  {
    id: 2,
    role: "Dean",
    title: "Project stage update",
    message: "A group moved to Alpha Defense and needs workflow monitoring.",
    category: "Defense",
    href: "/dean/administration/groups",
    createdAt: "2026-05-10T09:15:00.000Z",
    read: false,
  },
  {
    id: 3,
    role: "Student",
    title: "Adviser commented on Chapter 2",
    message: "Check adviser feedback and submit a revised version.",
    category: "Feedback",
    href: "/student/feedback",
    createdAt: "2026-05-10T10:00:00.000Z",
    read: false,
  },
  {
    id: 4,
    role: "Adviser",
    title: "Chapter submitted for review",
    message: "Project Pulse submitted Chapter 2 for adviser review.",
    category: "Document",
    href: "/adviser/reviews",
    createdAt: "2026-05-10T10:30:00.000Z",
    read: false,
  },
  {
    id: 5,
    role: "Dean",
    title: "Defense result submitted",
    message: "A panelist submitted a defense evaluation result.",
    category: "Defense",
    href: "/dean/defense",
    createdAt: "2026-05-10T11:00:00.000Z",
    read: true,
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function sortNotifications(notifications: StoredNotification[]) {
  return [...notifications].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function getStoredNotifications() {
  if (!canUseStorage()) return defaultNotifications;

  const saved = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);

  if (!saved) {
    saveStoredNotifications(defaultNotifications);
    return defaultNotifications;
  }

  const parsed = JSON.parse(saved) as StoredNotification[];
  return sortNotifications(parsed);
}

export function saveStoredNotifications(notifications: StoredNotification[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    NOTIFICATION_STORAGE_KEY,
    JSON.stringify(sortNotifications(notifications)),
  );
}

export function getNotificationsForRole(role: NotificationRole) {
  return getStoredNotifications().filter(
    (notification) => notification.role === role,
  );
}

export function addNotification(
  notification: Omit<StoredNotification, "id" | "createdAt" | "read">,
) {
  const notifications = getStoredNotifications();

  const nextNotification: StoredNotification = {
    ...notification,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  saveStoredNotifications([nextNotification, ...notifications]);

  return nextNotification;
}

export function markNotificationAsRead(id: number) {
  const notifications = getStoredNotifications().map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );

  saveStoredNotifications(notifications);
  return notifications;
}

export function markAllNotificationsAsRead(role: NotificationRole) {
  const notifications = getStoredNotifications().map((notification) =>
    notification.role === role ? { ...notification, read: true } : notification,
  );

  saveStoredNotifications(notifications);
  return notifications;
}

export function deleteNotification(id: number) {
  const notifications = getStoredNotifications().filter(
    (notification) => notification.id !== id,
  );

  saveStoredNotifications(notifications);
  return notifications;
}
