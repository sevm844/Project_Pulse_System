import StakeholderCalendar from "../../_components/StakeholderCalendar";

const categories = ["Defense", "Evaluation", "Review", "Messages"];

export default function PanelistCalendar() {
  return (
    <StakeholderCalendar
      title="Panelist Calendar"
      storageKey="project-pulse-panelist-calendar-notes"
      categories={categories}
      compact
    />
  );
}
