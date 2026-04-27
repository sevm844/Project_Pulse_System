"use client";

import { useState } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  activities,
  documents,
  members,
  project,
  tasks,
} from "../_data/mockStudentData";

type ProjectTab = "overview" | "documents" | "versions" | "tasks" | "activity" | "team";

export default function ProjectPage() {
  const [tab, setTab] = useState<ProjectTab>("overview");

  const tabs: Array<[ProjectTab, string]> = [
    ["overview", "Overview"],
    ["documents", "Documents"],
    ["versions", "Versions"],
    ["tasks", "Tasks"],
    ["activity", "Activity Log"],
    ["team", "Team"],
  ];

  return (
    <StudentShell title="My Project">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#203028]">
                {project.title}
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Manage project details, submissions, versions, requirements, and team information.
              </p>
            </div>
            <button className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
              Edit Project Info
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  tab === id
                    ? "bg-[#202823] text-white"
                    : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        {tab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[#203028]">Overview</h3>
              <p className="mt-4 text-sm leading-7 text-[#59645d]">
                {project.abstract}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  ["Adviser", project.adviser],
                  ["Stage", project.stage],
                  ["Last Submission", project.lastSubmission],
                  ["Completion", `${project.completion}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-xs text-[#7b877f]">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-[#203028]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[#203028]">
                Blockers & Next Actions
              </h3>
              <div className="mt-4 space-y-3">
                {tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-sm font-medium text-[#203028]">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-[#7b877f]">
                      {task.action}
                    </p>
                  </div>
                ))}
              </div>
              <button className="mt-5 w-full rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                Stage Requirements
              </button>
            </Card>
          </div>
        )}

        {tab === "documents" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Documents</h3>
            <div className="mt-4 space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="rounded-xl bg-[#f8faf7] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {document.type}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {document.version} • Updated {document.updated}
                      </p>
                    </div>
                    <StatusBadge status={document.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "versions" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Versions</h3>
            <div className="mt-4 space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {document.type} • {document.version}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Reviewer: {document.reviewer} • Updated {document.updated}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "tasks" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Tasks</h3>
            <div className="mt-4 space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {task.section} • Due {task.deadline}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "activity" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Activity Log</h3>
            <div className="mt-4 space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">{activity.date}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "team" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Team</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {members.map((member) => (
                <div key={member.email} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {member.name}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">{member.email}</p>
                  <p className="mt-2 text-xs font-semibold text-[#4f8f58]">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </StudentShell>
  );
}
