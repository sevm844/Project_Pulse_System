import StakeholderCalendar from "../../_components/StakeholderCalendar";

const categories = ["Daily Sync", "Tasks", "Education"];

export default function StudentCalendar() {
  return (
    <StakeholderCalendar
      title="My Calendar"
      storageKey="project-pulse-student-calendar-notes"
      categories={categories}
      compact
    />
  );
}
