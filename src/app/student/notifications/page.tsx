import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import { notifications } from "../_data/mockStudentData";

export default function NotificationsPage() {
  return (
    <StudentShell title="Notifications">
      <Card className="p-5">
{/* Page intro */}
        <div>
          <h2 className="text-lg font-semibold text-[#203028]">
            Notifications
          </h2>

          <p className="mt-1 text-sm text-[#7b877f]">
            System notifications for feedback, submissions, defense schedules,
            and adviser updates.
          </p>
        </div>

{/* Notification list */}
        <div className="mt-5 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-xl bg-[#f8faf7] p-4"
            >
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
    </StudentShell>
  );
}
