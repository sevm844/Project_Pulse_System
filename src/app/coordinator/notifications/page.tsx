"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
  groupFolders,
  getRequirementCounts,
} from "../_data/finalRecordsData";

type NotificationType =
  | "Missing Files"
  | "Submitted Files"
  | "Archive Ready"
  | "Message";

type NotificationPriority = "High" | "Normal" | "Low";

type CoordinatorNotification = {
  id: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  detail: string;
  groupName: string;
  course: string;
  date: string;
  actionLabel: string;
  href: string;
};

function priorityClasses(priority: NotificationPriority) {
  if (priority === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (priority === "Normal") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function typeClasses(type: NotificationType) {
  if (type === "Archive Ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (type === "Submitted Files") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (type === "Message") {
    return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function buildNotifications(): CoordinatorNotification[] {
  return groupFolders.flatMap((folder) => {
    const counts = getRequirementCounts(folder);
    const notifications: CoordinatorNotification[] = [];

    if (counts.missing > 0) {
      notifications.push({
        id: Number(`${folder.id}1`),
        type: "Missing Files",
        priority: counts.missing >= 3 ? "High" : "Normal",
        title: `${folder.groupName} has ${counts.missing} missing final file${
          counts.missing === 1 ? "" : "s"
        }`,
        detail:
          "Send a follow-up message and remind the group to complete their final requirement folder.",
        groupName: folder.groupName,
        course: `${folder.course} ${folder.section}`,
        date: folder.lastSubmission,
        actionLabel: "Message Group",
        href: "/coordinator/messages",
      });
    }

    if (counts.submitted > 0) {
      notifications.push({
        id: Number(`${folder.id}2`),
        type: "Submitted Files",
        priority: "Normal",
        title: `${folder.groupName} has ${counts.submitted} submitted file${
          counts.submitted === 1 ? "" : "s"
        } for checking`,
        detail:
          "Review submitted files and mark each final requirement as checked or returned.",
        groupName: folder.groupName,
        course: `${folder.course} ${folder.section}`,
        date: folder.lastSubmission,
        actionLabel: "Open Folder",
        href: "/coordinator/group-folders",
      });
    }

    if (counts.progress === 100) {
      notifications.push({
        id: Number(`${folder.id}3`),
        type: "Archive Ready",
        priority: "Low",
        title: `${folder.groupName} is ready for records archiving`,
        detail:
          "All final requirement files are checked and ready for archive records.",
        groupName: folder.groupName,
        course: `${folder.course} ${folder.section}`,
        date: folder.lastSubmission,
        actionLabel: "View Archive",
        href: "/coordinator/archive-records",
      });
    }

    if (folder.lastMessage) {
      notifications.push({
        id: Number(`${folder.id}4`),
        type: "Message",
        priority: "Low",
        title: `Recent message from ${folder.groupName}`,
        detail: `Last message activity: ${folder.lastMessage}.`,
        groupName: folder.groupName,
        course: `${folder.course} ${folder.section}`,
        date: folder.lastMessage,
        actionLabel: "Open Messages",
        href: "/coordinator/messages",
      });
    }

    return notifications;
  });
}

export default function CoordinatorNotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | NotificationType>("All");
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | NotificationPriority
  >("All");

  const notifications = useMemo(() => buildNotifications(), []);

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return notifications.filter((item) => {
      const searchable = [
        item.title,
        item.detail,
        item.groupName,
        item.course,
        item.type,
        item.priority,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;

      return matchesSearch && matchesType && matchesPriority;
    });
  }, [notifications, priorityFilter, searchQuery, typeFilter]);

  const highPriorityCount = notifications.filter(
    (item) => item.priority === "High",
  ).length;

  const submittedCount = notifications.filter(
    (item) => item.type === "Submitted Files",
  ).length;

  const archiveReadyCount = notifications.filter(
    (item) => item.type === "Archive Ready",
  ).length;

  function resetFilters() {
    setSearchQuery("");
    setTypeFilter("All");
    setPriorityFilter("All");
  }

  return (
    <CoordinatorShell title="Notifications">
      <div className="space-y-5">
        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[760px] divide-x divide-[#dfe8df]">
            {[
              ["Total", notifications.length, "Coordinator alerts"],
              ["High Priority", highPriorityCount, "Needs follow-up"],
              ["For Checking", submittedCount, "Submitted files"],
              ["Archive Ready", archiveReadyCount, "Complete folders"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-xs font-semibold text-[#7b877f]">{label}</p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold text-[#203028]">
                    {value}
                  </p>
                  <p className="pb-1 text-xs text-[#59645d]">{caption}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[820px] items-end gap-3">
            <label className="min-w-[300px] flex-1 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notification, group, course..."
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[190px] shrink-0 text-xs font-semibold text-[#59645d]">
              Type
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as "All" | NotificationType)
                }
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>Missing Files</option>
                <option>Submitted Files</option>
                <option>Archive Ready</option>
                <option>Message</option>
              </select>
            </label>

            <label className="w-[170px] shrink-0 text-xs font-semibold text-[#59645d]">
              Priority
              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value as "All" | NotificationPriority,
                  )
                }
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>High</option>
                <option>Normal</option>
                <option>Low</option>
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Coordinator Notification Feed
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              {filteredNotifications.length} notification
              {filteredNotifications.length === 1 ? "" : "s"} found.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredNotifications.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No notifications match the selected filters.
              </p>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_220px_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#203028]">
                        {item.title}
                      </p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${typeClasses(
                          item.type,
                        )}`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#59645d]">
                      {item.detail}
                    </p>
                    <p className="mt-2 text-xs text-[#7b877f]">
                      {item.groupName} • {item.course} • {item.date}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityClasses(
                        item.priority,
                      )}`}
                    >
                      {item.priority} Priority
                    </span>
                  </div>

                  <div className="lg:text-right">
                    <Link
                      href={item.href}
                      className="inline-flex rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                    >
                      {item.actionLabel}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </CoordinatorShell>
  );
}
