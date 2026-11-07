"use client";

import AdviserShell from "../_components/AdviserShell";
import NotificationsFeed from "../../_components/notifications/NotificationsFeed";

export default function AdviserNotificationsPage() {
  return (
    <AdviserShell title="Notifications">
      <NotificationsFeed />
    </AdviserShell>
  );
}
