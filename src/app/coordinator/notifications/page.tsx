"use client";

import CoordinatorShell from "../_components/CoordinatorShell";
import NotificationsFeed from "../../_components/notifications/NotificationsFeed";

export default function CoordinatorNotificationsPage() {
  return (
    <CoordinatorShell title="Notifications">
      <NotificationsFeed />
    </CoordinatorShell>
  );
}
