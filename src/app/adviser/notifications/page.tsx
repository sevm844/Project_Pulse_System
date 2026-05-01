import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import { notifications } from "../_data/mockAdviserData";

export default function AdviserNotificationsPage() {
  return (
    <AdviserShell title="Notifications">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-[#203028]">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-[#7b877f]">
          Review alerts, defense endorsements, student submissions, and adviser
          reminders.
        </p>

        <div className="mt-5 space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl bg-[#f8faf7] p-4">
              <p className="text-sm font-medium text-[#203028]">
                {notification.title}
              </p>
              <p className="mt-1 text-xs text-[#7b877f]">
                {notification.date}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </AdviserShell>
  );
}
