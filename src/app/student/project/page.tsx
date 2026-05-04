"use client";

import { FormEvent, useEffect, useState } from "react";
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
import {
  EditableProjectInfo,
  PROJECT_INFO_STORAGE_KEY,
} from "../_utils/projectInfoStorage";

type ProjectTab =
  | "overview"
  | "documents"
  | "versions"
  | "tasks"
  | "activity"
  | "team";

const tabs: Array<[ProjectTab, string]> = [
  ["overview", "Overview"],
  ["versions", "Versions"],
  ["tasks", "Tasks"],
  ["activity", "Activity Log"],
  ["team", "Team"],
];

export default function ProjectPage() {
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [projectInfo, setProjectInfo] = useState(project);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditableProjectInfo>({
    groupName: project.groupName,
    groupCode: project.groupCode,
    title: project.title,
    abstract: project.abstract,
    adviser: project.adviser,
    stage: project.stage,
    completion: project.completion,
  });

  useEffect(() => {
    const savedProjectInfo = localStorage.getItem(PROJECT_INFO_STORAGE_KEY);
    if (!savedProjectInfo) return;

    const parsedProjectInfo = JSON.parse(
      savedProjectInfo,
    ) as Partial<EditableProjectInfo>;

    queueMicrotask(() => {
      setProjectInfo((current) => ({
        ...current,
        ...parsedProjectInfo,
      }));
      setForm((current) => ({
        ...current,
        ...parsedProjectInfo,
      }));
    });
  }, []);

  function openProjectEditor() {
    setForm({
      groupName: projectInfo.groupName,
      groupCode: projectInfo.groupCode,
      title: projectInfo.title,
      abstract: projectInfo.abstract,
      adviser: projectInfo.adviser,
      stage: projectInfo.stage,
      completion: projectInfo.completion,
    });
    setIsEditing(true);
  }

  function updateForm<K extends keyof EditableProjectInfo>(
    field: K,
    value: EditableProjectInfo[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveProjectInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProjectInfo = {
      ...projectInfo,
      ...form,
      completion: Math.min(100, Math.max(0, Number(form.completion) || 0)),
    };

    setProjectInfo(nextProjectInfo);
    localStorage.setItem(
      PROJECT_INFO_STORAGE_KEY,
      JSON.stringify({
        groupName: nextProjectInfo.groupName,
        groupCode: nextProjectInfo.groupCode,
        title: nextProjectInfo.title,
        abstract: nextProjectInfo.abstract,
        adviser: nextProjectInfo.adviser,
        stage: nextProjectInfo.stage,
        completion: nextProjectInfo.completion,
      }),
    );
    setIsEditing(false);
  }

  return (
    <StudentShell title="My Project">
      <div className="space-y-5">
{/* Project header */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#203028]">
                {projectInfo.title}
              </h2>

              <p className="mt-1 text-sm text-[#7b877f]">
                Manage project details, submissions, versions, requirements,
                and team information.
              </p>
            </div>

            <button
              type="button"
              onClick={openProjectEditor}
              className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
            >
              Edit Project Info
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
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

{/* Overview */}
        {tab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[#203028]">
                Overview
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#59645d]">
                {projectInfo.abstract}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  ["Group Name", projectInfo.groupName],
                  ["Group Code", projectInfo.groupCode],
                  ["Adviser", projectInfo.adviser],
                  ["Stage", projectInfo.stage],
                  ["Last Submission", projectInfo.lastSubmission],
                  ["Completion", `${projectInfo.completion}%`],
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

{/* Documents */}
        {tab === "documents" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Documents
            </h3>

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

{/* Versions */}
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

{/* Tasks */}
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

{/* Activity log */}
        {tab === "activity" && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">
              Activity Log
            </h3>

            <div className="mt-4 space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {activity.title}
                  </p>

                  <p className="mt-1 text-xs text-[#7b877f]">
                    {activity.date}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

{/* Team */}
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

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#203028]/35 px-4 py-6">
          <form
            onSubmit={saveProjectInfo}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-xl"
          >
            <div className="flex flex-col gap-3 border-b border-[#edf2ec] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#203028]">
                  Edit Project Info
                </h3>
                <p className="mt-1 text-sm text-[#7b877f]">
                  Update the project details shown on this dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
              >
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-[#203028]">
                <span>Project Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#203028]">
                <span>Adviser</span>
                <input
                  required
                  value={form.adviser}
                  onChange={(event) =>
                    updateForm("adviser", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#203028]">
                <span>Group Name</span>
                <input
                  required
                  value={form.groupName}
                  onChange={(event) =>
                    updateForm("groupName", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#203028]">
                <span>Group Code</span>
                <input
                  required
                  value={form.groupCode}
                  onChange={(event) =>
                    updateForm("groupCode", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#203028]">
                <span>Current Stage</span>
                <input
                  required
                  value={form.stage}
                  onChange={(event) => updateForm("stage", event.target.value)}
                  className="w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#203028] md:col-span-2">
                <span>Completion</span>
                <input
                  min={0}
                  max={100}
                  type="number"
                  value={form.completion}
                  onChange={(event) =>
                    updateForm("completion", Number(event.target.value))
                  }
                  className="w-full rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#203028] md:col-span-2">
                <span>Abstract / Description</span>
                <textarea
                  required
                  rows={5}
                  value={form.abstract}
                  onChange={(event) =>
                    updateForm("abstract", event.target.value)
                  }
                  className="w-full resize-none rounded-xl border border-[#dfe8df] px-3 py-2.5 text-sm font-normal leading-6 outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-[#edf2ec] pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </StudentShell>
  );
}
