import Link from "next/link";
import PanelistShell from "../_components/PanelistShell";
import Card from "../_components/Card";
import { panelistDefenses } from "../_data/panelistData";

export default function PanelistNotificationsPage() {
  const notifications = panelistDefenses.flatMap((defense) => {
    const items = [];

    if (defense.evaluationStatus === "Pending") {
      items.push({
        id: `${defense.id}-pending`,
        title: `${defense.groupName} evaluation is pending`,
        detail: `${defense.stage} on ${defense.date} at ${defense.time}, ${defense.venue}.`,
        href: "/panelist/evaluations",
        action: "Evaluate",
      });
    }

    if (defense.documentStatus === "Available") {
      items.push({
        id: `${defense.id}-docs`,
        title: `${defense.groupName} documents are available`,
        detail: `Review ${defense.documentTitle} before the defense.`,
        href: "/panelist/documents",
        action: "Open Documents",
      });
    }

    return items;
  });

  return (
    <PanelistShell title="Notifications">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#203028]">
            Panelist Notifications
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Defense reminders, document access, and pending evaluation alerts.
          </p>
        </div>

        <div className="divide-y divide-[#edf2ec]">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-[#203028]">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-[#59645d]">{item.detail}</p>
              </div>

              <Link
                href={item.href}
                className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
              >
                {item.action}
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </PanelistShell>
  );
}
