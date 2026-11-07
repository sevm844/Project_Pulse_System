"use client";

import PanelistShell from "../_components/PanelistShell";
import NotificationsFeed from "../../_components/notifications/NotificationsFeed";

export default function PanelistNotificationsPage() {
  return (
    <PanelistShell title="Notifications">
      <NotificationsFeed />
    </PanelistShell>
  );
}
