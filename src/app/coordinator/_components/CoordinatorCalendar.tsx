import StakeholderCalendar from "../../_components/StakeholderCalendar";

const categories = ["Collection", "Follow-up", "Archive", "Messages"];

export default function CoordinatorCalendar() {
  return (
    <StakeholderCalendar
      title="Coordinator Calendar"
      storageKey="project-pulse-coordinator-calendar-notes"
      categories={categories}
      compact
    />
  );
}
