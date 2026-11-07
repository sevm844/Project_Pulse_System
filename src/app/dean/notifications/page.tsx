"use client";

import DeanShell from "../_components/DeanShell";
import NotificationsFeed from "../../_components/notifications/NotificationsFeed";

export default function DeanNotificationsPage() {
  return (
    <DeanShell title="Notifications">
      <NotificationsFeed />
    </DeanShell>
  );
}
