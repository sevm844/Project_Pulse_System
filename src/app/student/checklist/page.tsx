"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { tasks as initialTasks, type TaskItem } from "../_data/mockStudentData";
import {
  getStoredStudentGroup,
  hasStoredStudentGroup,
  subscribeToStudentGroupStorage,
} from "../_utils/studentGroupStorage";
import {
  isTaskAllowedForStage,
  normalizeProjectStage,
  type ProjectStage,
} from "../../_utils/projectWorkflow";

const checklistSections = [
  "Stage Requirement",
  "Missing Deliverable",
  "Adviser Approval",
  "Final Requirement",
];

export default function ChecklistPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState<TaskItem | null>(null);
  const [currentStage, setCurrentStage] =
    useState<ProjectStage>("Proposal Defense");

  const hasGroup = useSyncExternalStore(
    subscribeToStudentGroupStorage,
    hasStoredStudentGroup,
    () => false,
  );

  useEffect(() => {
    const group = getStoredStudentGroup();
    if (group?.stage) {
      queueMicrotask(() => setCurrentStage(normalizeProjectStage(group.stage)));
    }
  }, [hasGroup]);

  function completeTask(task: TaskItem) {
    if (!isTaskAllowedForStage(task, currentStage)) return;

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
            Current workflow stage:{" "}
            <span className="font-semibold text-[#203028]">{currentStage}</span>
          </p>
          <p className="mt-1 text-sm text-[#7b877f]">
            Actions are restricted depending on the current project stage.
          </p>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {checklistSections.map((section) => {
            const sectionTasks = tasks.filter(
              (task) => task.section === section,
            );

            return (
              <Card key={section} className="p-5">
                <h3 className="text-base font-semibold text-[#203028]">
                  {section}
                </h3>

                <div className="mt-4 space-y-3">
                  {sectionTasks.map((task) => {
                    const allowed = isTaskAllowedForStage(task, currentStage);

                    return (
                      <button
                        key={task.id}
                        type="button"
                        disabled={!allowed}
                        onClick={() => setSelected(task)}
                        className={`w-full rounded-xl p-4 text-left transition ${
                          allowed
                            ? "bg-[#f8faf7] hover:bg-[#eff6ee]"
                            : "cursor-not-allowed bg-gray-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#203028]">
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs text-[#7b877f]">
                              Deadline: {task.deadline}
                            </p>
                            {!allowed && (
                              <p className="mt-2 text-xs font-medium text-rose-600">
                                Locked for {currentStage}
                              </p>
                            )}
                          </div>

                          <StatusBadge status={task.status} />
                        </div>
                      </button>
                    );
                  })}

                  {sectionTasks.length === 0 && (
                    <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                      No checklist items in this section.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
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

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => completeTask(selected)}
                  className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
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
