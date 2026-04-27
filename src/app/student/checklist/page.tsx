"use client";

import { useState } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { tasks as initialTasks, type TaskItem } from "../_data/mockStudentData";

export default function ChecklistPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState<TaskItem | null>(null);

  const sections = [
    "Stage Requirement",
    "Missing Deliverable",
    "Adviser Approval",
    "Final Requirement",
  ];

  function completeTask(task: TaskItem) {
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: "Completed" } : item,
      ),
    );
    setSelected(null);
  }

  return (
    <StudentShell title="Tasks / Checklist">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Tasks / Checklist
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Stage requirements, missing deliverables, deadlines, adviser
            approvals, and final requirements.
          </p>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {sections.map((section) => (
            <Card key={section} className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                {section}
              </h3>

              <div className="mt-4 space-y-3">
                {tasks
                  .filter((task) => task.section === section)
                  .map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelected(task)}
                      className="w-full rounded-xl bg-[#f8faf7] p-4 text-left transition hover:bg-[#eff6ee]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#203028]">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-[#7b877f]">
                            Deadline: {task.deadline}
                          </p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                    </button>
                  ))}
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[#203028]">
                Requirement Details
              </h2>
              <div className="mt-5 rounded-xl bg-[#f8faf7] p-4">
                <p className="font-semibold text-[#203028]">
                  {selected.title}
                </p>
                <p className="mt-1 text-sm text-[#7b877f]">
                  Deadline: {selected.deadline}
                </p>
                <p className="mt-3 text-sm text-[#59645d]">
                  Required action: {selected.action}
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-[#dfe8df] p-5 text-center">
                <p className="text-sm font-medium text-[#203028]">
                  Upload or complete linked requirement
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  In deployment, this connects to requirement upload and
                  checklist records.
                </p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => completeTask(selected)}
                  className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                >
                  Submit Requirement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
