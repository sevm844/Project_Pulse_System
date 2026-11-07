"use client";

import StudentShell from "../_components/StudentShell";
import NotificationsFeed from "../../_components/notifications/NotificationsFeed";

export default function StudentNotificationsPage() {
  return (
    <StudentShell title="Notifications">
      <NotificationsFeed />
    </StudentShell>
  );
}
