import StakeholderCalendar from "../../_components/StakeholderCalendar";

const categories = ["Reviews", "Feedback", "Certificates", "Messages"];

export default function GrammarianCalendar() {
  return (
    <StakeholderCalendar
      title="Grammarian Calendar"
      storageKey="project-pulse-grammarian-calendar-notes"
      categories={categories}
      compact
    />
  );
}
