"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function StudentPage() {
  const [hasGroup, setHasGroup] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileImage, setProfileImage] = useState("/default-avatar.png");
  const [message, setMessage] = useState("");
  const [versions, setVersions] = useState([
    {
      version: "v1",
      title: "Chapter 1: Introduction",
      date: "Apr 20",
      status: "Approved",
    },
    {
      version: "v2",
      title: "Chapter 2: RRL",
      date: "Apr 23",
      status: "Needs Revision",
    },
  ]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: `
      <h2>Chapter 2: Review of Related Literature</h2>
      <p>Start revising your manuscript here based on adviser feedback.</p>
    `,
    editorProps: {
      attributes: {
        class: "min-h-[420px] outline-none text-sm leading-7 text-gray-700",
      },
    },
  });

  function handleProfileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
  }

  function handleSubmitForReview() {
    const nextVersion = `v${versions.length + 1}`;

    setVersions([
      {
        version: nextVersion,
        title: "Chapter 2: RRL",
        date: "Today",
        status: "Submitted",
      },
      ...versions,
    ]);

    setMessage(`${nextVersion} submitted for adviser review.`);
  }

  if (!hasGroup) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0f172a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_90%,#16a34a_0%,#064e3b_28%,#020617_70%)]" />

        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-6xl">
            <div className="mb-12 flex items-center gap-3">
              <Image
                src="/logotop.png"
                alt="Project Pulse Logo"
                width={40}
                height={40}
              />
              <span className="text-xl font-semibold">
                Project <span className="text-green-400">Pulse</span>
              </span>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-green-300">
                  Student Setup
                </p>
                <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                  Start by joining your capstone group
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">
                  Create or join a group before accessing your dashboard,
                  documents, checklist, feedback, and defense schedule.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-white/10 p-7 backdrop-blur-md">
                  <h2 className="text-2xl font-semibold">Create Group</h2>
                  <p className="mt-2 text-sm text-gray-300">
                    For group leaders creating a new capstone workspace.
                  </p>

                  <div className="mt-6 space-y-4">
                    <input
                      type="text"
                      placeholder="Group Name"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Project Title"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    />
                    <button
                      onClick={() => setHasGroup(true)}
                      className="w-full rounded-2xl bg-green-500 py-3 font-medium text-black hover:bg-green-400"
                    >
                      Create Group
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/10 p-7 backdrop-blur-md">
                  <h2 className="text-2xl font-semibold">Join Group</h2>
                  <p className="mt-2 text-sm text-gray-300">
                    Enter the code given by your group leader or coordinator.
                  </p>

                  <div className="mt-6 space-y-4">
                    <input
                      type="text"
                      placeholder="Group Code"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    />
                    <button
                      onClick={() => setHasGroup(true)}
                      className="w-full rounded-2xl border border-white/20 py-3 font-medium text-white hover:bg-white/10"
                    >
                      Join Group
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (showEditor) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] text-gray-900">
        <header className="flex items-center justify-between border-b bg-white px-8 py-5">
          <button
            onClick={() => setShowEditor(false)}
            className="rounded-2xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-lg font-semibold">Document Editor</h1>

          <span className="rounded-full bg-green-50 px-4 py-2 text-sm text-green-700">
            Draft Mode
          </span>
        </header>

        <section className="mx-auto grid max-w-7xl gap-6 px-8 py-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className="rounded-xl border px-3 py-2 text-sm font-bold hover:bg-green-50"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className="rounded-xl border px-3 py-2 text-sm italic hover:bg-green-50"
              >
                I
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className="rounded-xl border px-3 py-2 text-sm hover:bg-green-50"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleBulletList().run()
                }
                className="rounded-xl border px-3 py-2 text-sm hover:bg-green-50"
              >
                • List
              </button>
            </div>

            <div className="min-h-[520px] rounded-[1.5rem] border bg-white p-6">
              <EditorContent editor={editor} />
            </div>

            {message && (
              <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setMessage("Draft saved successfully.")}
                className="rounded-2xl border px-5 py-3 text-sm font-medium hover:bg-gray-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleSubmitForReview}
                className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700"
              >
                Submit for Review
              </button>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="font-semibold">Version History</h2>

              <div className="mt-4 space-y-3">
                {versions.map((item) => (
                  <div key={item.version} className="rounded-2xl border p-4">
                    <p className="text-sm font-medium">
                      {item.version} — {item.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{item.date}</p>
                    <span className="mt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="font-semibold">Adviser Feedback</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p className="rounded-2xl bg-gray-50 p-3">
                  Clarify the scope of the study.
                </p>
                <p className="rounded-2xl bg-gray-50 p-3">
                  Add more related studies.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-gray-900">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`hidden flex-col justify-between bg-[#111827] px-4 py-5 text-white transition-all duration-300 lg:flex ${
            sidebarCollapsed ? "w-20" : "w-56"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/logotop.png"
                  alt="Logo"
                  width={36}
                  height={36}
                />

                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-sm font-semibold">
                      Project <span className="text-green-400">Pulse</span>
                    </h1>
                    <p className="text-[10px] text-gray-400">
                      Student Workspace
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-300 hover:bg-white/10"
              >
                {sidebarCollapsed ? "→" : "←"}
              </button>
            </div>

            <div
              className={`mt-8 flex items-center rounded-xl border border-white/10 bg-white/5 p-2 ${
                sidebarCollapsed ? "justify-center" : "gap-2"
              }`}
            >
              <label className="group relative cursor-pointer">
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/50 text-[9px] group-hover:flex">
                  Edit
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileUpload}
                  className="hidden"
                />
              </label>

              {!sidebarCollapsed && (
                <div>
                  <p className="text-sm font-semibold">Student Name</p>
                  <p className="text-[11px] text-gray-400">1234567@ub.edu.ph</p>
                </div>
              )}
            </div>

            <nav className="mt-6 space-y-1 text-sm font-medium">
              {[
                  ["Dashboard", "🏠", "/student"],
                  ["My Project", "📂", "/student/project"],
                  ["Documents", "📄", "/student/documents"],
                  ["Feedback", "💬", "/student/feedback"],
                  ["Checklist", "✔️", "/student/checklist"],
                  ["Defense", "🎓", "/student/defense"],
                  ["Adviser Chat", "👤", "/student/chat"],
                ].map(([item, icon, href], index) => (
            <Link
              key={item}
              href={href}
              title={item}
                 className={`flex w-full items-center rounded-xl text-left transition ${
               sidebarCollapsed
                 ? "justify-center px-0 py-3"
                 : "gap-3 px-4 py-2.5"
              } ${
               index === 0
                 ? "bg-green-500 text-white"
                 : "text-gray-400 hover:bg-white/5 hover:text-white"
                   }`}
                  >
                 <span>{icon}</span>
                  {!sidebarCollapsed && <span>{item}</span>}
                 </Link>
        ))}
            </nav>
          </div>

          <Link
            href="/login"
            title="Log out"
            className={`rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 ${
              sidebarCollapsed
                ? "flex justify-center px-0 py-3"
                : "px-4 py-3"
            }`}
          >
            {sidebarCollapsed ? "↩" : "Log out →"}
          </Link>
        </aside>

        {/* MAIN */}
        <section className="flex-1 px-6 py-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="w-full max-w-sm rounded-full bg-white px-5 py-3 shadow-sm">
              <input
                placeholder="Search project, feedback, document..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-full bg-white p-3 shadow-sm">🔔</button>
              <button className="rounded-full bg-white p-3 shadow-sm">✉️</button>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.7fr_0.9fr]">
            <div className="space-y-8">
              <div className="rounded-[2rem] bg-gradient-to-r from-green-600 to-emerald-400 p-8 text-white shadow-sm">
                <p className="text-sm text-green-50">Capstone Workspace</p>
                <h1 className="mt-6 text-3xl font-semibold">
                  Welcome back, Student!
                </h1>
                <p className="mt-2 text-green-50">
                  Your group is preparing for Alpha Defense.
                </p>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-semibold">
                  Project Validation
                </h2>

                <div className="grid gap-5 md:grid-cols-3">
                  {[
                    ["Documents", "6/10", "📄"],
                    ["Feedback Addressed", "3/8", "✅"],
                    ["Checklist", "7/12", "📋"],
                  ].map(([title, value, icon]) => (
                    <div
                      key={title}
                      className="rounded-[2rem] bg-white p-6 shadow-sm"
                    >
                      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-2xl">
                        {icon}
                      </div>
                      <p className="text-sm text-gray-500">{title}</p>
                      <p className="mt-1 text-2xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="rounded-[2rem] border border-green-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Document Editor</h2>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                      Open
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    Edit your manuscript, save drafts, submit new versions, and
                    track revision history.
                  </p>
                  <div className="mt-6 h-2 rounded-full bg-gray-100">
                    <div className="h-2 w-[68%] rounded-full bg-green-500" />
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Chapter 2 Draft • 68%
                  </p>
                </button>

                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Activities</h2>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Chapter 2 submitted", "Today"],
                      ["Adviser added feedback", "Yesterday"],
                      ["Checklist updated", "Apr 24"],
                    ].map(([title, date]) => (
                      <div
                        key={title}
                        className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
                      >
                        <p className="text-sm font-medium">{title}</p>
                        <span className="text-xs text-gray-400">{date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Pending Feedback</h2>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Clarify scope of study", "Pending"],
                      ["Add more related studies", "Pending"],
                      ["Revise objectives", "Addressed"],
                    ].map(([title, status]) => (
                      <div
                        key={title}
                        className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
                      >
                        <p className="text-sm font-medium">{title}</p>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Stage Progress</h2>
                  <div className="mt-5 space-y-5">
                    {[
                      ["Proposal Review", "85%"],
                      ["Alpha Defense", "60%"],
                      ["Beta Defense", "20%"],
                    ].map(([title, progress]) => (
                      <div key={title}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>{title}</span>
                          <span className="text-gray-500">{progress}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: progress }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">My Project</h2>

                <div className="mt-5 rounded-3xl bg-green-50 p-5">
                  <h3 className="font-semibold">
                    Smart Capstone Monitoring System
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Current Stage: Alpha Defense
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="font-semibold text-green-600">68%</p>
                      <p className="text-gray-500">Progress</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="font-semibold text-green-600">3</p>
                      <p className="text-gray-500">Feedback</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="font-semibold text-green-600">2</p>
                      <p className="text-gray-500">Versions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Defense Schedule</h2>
                <div className="mt-5 space-y-3">
                  {["Alpha Defense", "Beta Defense", "Final Defense"].map(
                    (item, index) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{item}</p>
                          <p className="text-xs text-gray-500">
                            {index === 0
                              ? "Pending coordinator schedule"
                              : "Not scheduled"}
                          </p>
                        </div>
                        <span className="text-gray-400">›</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Upcoming Tasks</h2>
                <div className="mt-5 space-y-3">
                  {[
                    ["Upload monitoring form", "Required"],
                    ["Resolve Chapter 2 comments", "Pending"],
                    ["Prepare Alpha files", "Upcoming"],
                  ].map(([title, sub]) => (
                    <div key={title} className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-gray-500">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}