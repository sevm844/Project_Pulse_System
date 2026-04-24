import Image from "next/image";
import Link from "next/link";

const chapterProgress = [
  { chapter: "Chapter 1", status: "Completed", percent: 100 },
  { chapter: "Chapter 2", status: "Completed", percent: 100 },
  { chapter: "Chapter 3", status: "In Review", percent: 80 },
  { chapter: "Chapter 4", status: "Not Started", percent: 20 },
  { chapter: "Chapter 5", status: "Not Started", percent: 0 },
];

const checklistItems = [
  { title: "Upload revised Chapter 3", status: "Pending" },
  { title: "Resolve adviser feedback", status: "Pending" },
  { title: "Submit Capstone Monitoring Form", status: "Required" },
  { title: "Prepare Alpha Defense files", status: "Upcoming" },
];

const recentActivities = [
  "You uploaded Version 3 of Chapter 3.",
  "Adviser posted 2 new feedback items.",
  "Alpha Defense schedule was updated.",
  "Checklist item added: Submit monitoring form.",
];

const notifications = [
  "Your adviser requested revisions for Chapter 3.",
  "Defense schedule is now available.",
  "You have 3 pending feedback items.",
];

const quickActions = [
  { label: "Upload Document", href: "/student/documents" },
  { label: "View Feedback", href: "/student/feedback" },
  { label: "Open Adviser Chat", href: "/student/chat" },
  { label: "View Checklist", href: "/student/checklist" },
];

function getStatusStyle(status: string) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";
    case "In Review":
      return "bg-yellow-100 text-yellow-700";
    case "Pending":
      return "bg-red-100 text-red-700";
    case "Required":
      return "bg-blue-100 text-blue-700";
    case "Upcoming":
      return "bg-purple-100 text-purple-700";
    case "Not Started":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function StudentDashboardPage() {
  const overallProgress = 60;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-72 flex-col border-r bg-white px-6 py-6">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/Logo.png"
              alt="Project Pulse Logo"
              width={34}
              height={34}
            />
            <span className="text-lg font-semibold tracking-tight">
              Project <span className="text-green-600">Pulse</span>
            </span>
          </div>

          <nav className="space-y-2 text-sm">
            <Link href="/student" className="block rounded-xl bg-green-50 px-4 py-3 font-medium text-green-700">
              Dashboard
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              My Project
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Documents
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Feedback
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Tasks / Checklist
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Defense
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Adviser Chat
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Notifications
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Resources
            </Link>
            <Link href="#" className="block rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
              Profile / Group Members
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl border bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-800">Need help?</p>
            <p className="mt-1 text-sm text-gray-500">
              Contact your adviser or coordinator for project concerns.
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          {/* TOPBAR */}
          <header className="border-b bg-white px-6 py-4 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-500">Student Dashboard</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome back, Student
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button className="rounded-xl border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Notifications
                </button>
                <Link
                  href="/login"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Log out
                </Link>
              </div>
            </div>
          </header>

          <section className="px-6 py-8 md:px-8">
            {/* HERO SUMMARY */}
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <div className="rounded-3xl bg-white p-6 shadow-sm border">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Active Project
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Smart Capstone Monitoring System
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 max-w-2xl">
                      Monitor submissions, revisions, defense readiness, and
                      final requirements through a centralized capstone
                      workflow.
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                    Current Stage: Alpha Defense
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 p-4 border">
                    <p className="text-sm text-gray-500">Assigned Adviser</p>
                    <p className="mt-1 font-semibold">Prof. Maria Santos</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 border">
                    <p className="text-sm text-gray-500">Group Members</p>
                    <p className="mt-1 font-semibold">3 Members</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 border">
                    <p className="text-sm text-gray-500">Pending Feedback</p>
                    <p className="mt-1 font-semibold">3 Items</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Overall Progress</span>
                    <span className="font-medium text-gray-800">
                      {overallProgress}%
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-green-600"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border">
                <p className="text-sm font-medium text-green-600">
                  Upcoming Defense
                </p>
                <h3 className="mt-2 text-xl font-semibold">Alpha Defense</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-800">Date:</span> May 10, 2026</p>
                  <p><span className="font-medium text-gray-800">Time:</span> 1:00 PM</p>
                  <p><span className="font-medium text-gray-800">Room:</span> CICT Lab 2</p>
                  <p><span className="font-medium text-gray-800">Panelists:</span> 3 Assigned</p>
                </div>

                <button className="mt-6 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700">
                  View Defense Details
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Quick Actions
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    Continue your project work
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-2xl border bg-gray-50 p-4 hover:bg-green-50 hover:border-green-200 transition"
                  >
                    <p className="font-medium">{action.label}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Open this feature
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* MIDDLE GRID */}
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              {/* CHAPTER PROGRESS */}
              <div className="rounded-3xl bg-white p-6 shadow-sm border">
                <p className="text-sm font-medium text-green-600">
                  Chapter Completion
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  Progress by chapter
                </h3>

                <div className="mt-5 space-y-4">
                  {chapterProgress.map((item) => (
                    <div key={item.chapter} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{item.chapter}</p>
                          <p className="text-sm text-gray-500">
                            Status: {item.status}
                          </p>
                        </div>
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 h-2.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2.5 rounded-full bg-green-600"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TASKS + NOTIFICATIONS */}
              <div className="space-y-6">
                <div className="rounded-3xl bg-white p-6 shadow-sm border">
                  <p className="text-sm font-medium text-green-600">
                    Tasks / Checklist
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    What you need to do next
                  </h3>

                  <div className="mt-5 space-y-3">
                    {checklistItems.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start justify-between gap-3 rounded-2xl border p-4"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {item.title}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm border">
                  <p className="text-sm font-medium text-green-600">
                    Notifications
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    Recent alerts
                  </h3>

                  <div className="mt-5 space-y-3">
                    {notifications.map((item, index) => (
                      <div key={index} className="rounded-2xl bg-gray-50 border p-4">
                        <p className="text-sm text-gray-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM GRID */}
            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm border">
                <p className="text-sm font-medium text-green-600">
                  Recent Activity
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  Latest project actions
                </h3>

                <div className="mt-5 space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-2xl border p-4"
                    >
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-600" />
                      <p className="text-sm text-gray-700">{activity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border">
                <p className="text-sm font-medium text-green-600">
                  Group Information
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  Team and project details
                </h3>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <p className="text-gray-500">Project Title</p>
                    <p className="mt-1 font-medium text-gray-800">
                      Smart Capstone Monitoring System
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <p className="text-gray-500">Group Members</p>
                    <p className="mt-1 font-medium text-gray-800">
                      Juan Dela Cruz, Maria Lopez, Angela Ramos
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <p className="text-gray-500">Last Submission</p>
                    <p className="mt-1 font-medium text-gray-800">
                      Chapter 3 - Version 3
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <p className="text-gray-500">Blockers</p>
                    <p className="mt-1 font-medium text-gray-800">
                      Awaiting adviser verification and monitoring form submission
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}