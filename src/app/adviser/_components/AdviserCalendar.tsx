import StakeholderCalendar from "../../_components/StakeholderCalendar";

const categories = ["Reviews", "Consultations", "Defense"];

export default function AdviserCalendar() {
  return (
    <StakeholderCalendar
      title="Adviser Calendar"
      storageKey="project-pulse-adviser-calendar-notes"
      categories={categories}
      variant="glass"
    />
  );
}
