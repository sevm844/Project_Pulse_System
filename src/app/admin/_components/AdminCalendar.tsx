import StakeholderCalendar from "../../_components/StakeholderCalendar";

const categories = ["Setup", "Requests", "Audit", "Assignments"];

export default function AdminCalendar() {
  return (
    <StakeholderCalendar
      title="Admin Calendar"
      storageKey="project-pulse-admin-calendar-notes"
      categories={categories}
    />
  );
}
