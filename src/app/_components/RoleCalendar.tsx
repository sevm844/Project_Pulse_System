"use client";

import { useCalendarEvents, type CalendarRole } from "../_lib/calendarEvents";
import StakeholderCalendar from "./StakeholderCalendar";

const settings: Record<CalendarRole, { title: string; storageKey: string; categories: readonly string[] }> = {
  Student: {
    title: "My Calendar",
    storageKey: "project-pulse-student-calendar-notes",
    categories: ["Daily Sync", "Tasks", "Education"],
  },
  Adviser: {
    title: "Adviser Calendar",
    storageKey: "project-pulse-adviser-calendar-notes",
    categories: ["Consultation", "Review", "Defense", "Messages"],
  },
  Dean: {
    title: "Dean Calendar",
    storageKey: "project-pulse-dean-calendar-notes",
    categories: ["Approvals", "Defense", "Reports"],
  },
  Panelist: {
    title: "Panelist Calendar",
    storageKey: "project-pulse-panelist-calendar-notes",
    categories: ["Defense", "Evaluation", "Review", "Messages"],
  },
  Secretary: {
    title: "Dean's Secretary Calendar",
    storageKey: "project-pulse-secretary-calendar-notes",
    categories: ["Collection", "Records", "Archive", "Messages"],
  },
  Grammarian: {
    title: "Grammarian Calendar",
    storageKey: "project-pulse-grammarian-calendar-notes",
    categories: ["Reviews", "Feedback", "Certificates", "Messages"],
  },
};

// The same calendar for every role: its real dates from the backend, plus personal notes in this browser.
export default function RoleCalendar({ role, compact = true }: { role: CalendarRole; compact?: boolean }) {
  const { events, loading, failed } = useCalendarEvents(role);

  return (
    <StakeholderCalendar
      {...settings[role]}
      compact={compact}
      events={events}
      eventsLoading={loading}
      eventsFailed={failed}
    />
  );
}
