"use client";

import GrammarianShell from "../_components/GrammarianShell";
import NotificationsFeed from "../../_components/notifications/NotificationsFeed";

export default function GrammarianNotificationsPage() {
  return (
    <GrammarianShell title="Notifications">
      <NotificationsFeed />
    </GrammarianShell>
  );
}
