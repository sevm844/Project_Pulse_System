import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import { deanNotifications } from "../_data/mockDeanData";

export default function DeanNotificationsPage() {
  return (
    <DeanShell title="Notifications">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-[#203028]">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-[#7b877f]">
          Executive alerts for approvals, risks, defense outcomes, and records
          validation.
        </p>

        <div className="mt-5 space-y-3">
          {deanNotifications.map((notification) => (
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
    </DeanShell>
  );
}
