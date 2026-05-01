import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import { scheduleItems } from "../_data/mockAdviserData";

export default function AdviserSchedulePage() {
  return (
    <AdviserShell title="Schedule">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-[#203028]">Schedule</h2>
        <p className="mt-1 text-sm text-[#7b877f]">
          Consultations, review deadlines, and defense-related schedules.
        </p>

        <div className="mt-5 space-y-3">
          {scheduleItems.map((item) => (
            <div key={item.id} className="rounded-xl bg-[#f8faf7] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#203028]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {item.date} • {item.time}
                  </p>
                </div>

                <span className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-semibold text-[#59645d]">
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdviserShell>
  );
}
