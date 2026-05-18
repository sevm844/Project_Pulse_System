import StakeholderCalendar from "../../_components/StakeholderCalendar";

const categories = ["Approvals", "Defense", "Reports"];

export default function DeanCalendar() {
  return (
    <StakeholderCalendar
      title="Dean Calendar"
      storageKey="project-pulse-dean-calendar-notes"
      categories={categories}
      variant="glass"
    />
  );
}
