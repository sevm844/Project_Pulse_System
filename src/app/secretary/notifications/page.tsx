"use client";

import SecretaryShell from "../_components/SecretaryShell";
import NotificationsFeed from "../../_components/notifications/NotificationsFeed";

export default function SecretaryNotificationsPage() {
  return (
    <SecretaryShell title="Notifications">
      <NotificationsFeed />
    </SecretaryShell>
  );
}
