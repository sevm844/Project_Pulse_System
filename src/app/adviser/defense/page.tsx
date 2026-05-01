"use client";

import { useMemo, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  courses,
  defenseEndorsements,
  sections,
  type CourseCode,
  type GroupStage,
} from "../_data/mockAdviserData";

const stages: GroupStage[] = [
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
];

export default function AdviserDefensePage() {
  const [items, setItems] = useState(defenseEndorsements);

  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState<"All" | GroupStage>("All");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCourse = course === "All" || item.course === course;
      const matchesSection = section === "All" || item.section === section;
      const matchesStage = stage === "All" || item.stage === stage;

      return matchesCourse && matchesSection && matchesStage;
    });
  }, [course, section, stage, items]);

  function updateReadiness(id: number, status: "Ready" | "Not Ready") {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  return (
    <AdviserShell title="Defense">
      <div className="space-y-5">
        {/* Filters */}
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Course
              </label>
              <select
                value={course}
                onChange={(e) =>
                  setCourse(e.target.value as "All" | CourseCode)
                }
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {courses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {sections.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as "All" | GroupStage)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {stages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Readiness cards */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Defense Readiness
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Validate monitoring forms, feedback completion, required files, and
            defense readiness before endorsement.
          </p>
        </Card>

        {filteredItems.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-[#203028]">
                    {item.groupName}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>

                <p className="mt-2 text-sm text-[#7b877f]">
                  {item.course} {item.section} • {item.stage}
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  {item.projectTitle}
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">{item.schedule}</p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-xs text-[#7b877f]">
                      Completion Checks
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[#203028]">
                      {item.completionRate}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-xs text-[#7b877f]">
                      Feedback Completion
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[#203028]">
                      {item.feedbackCompletion}%
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#203028]">
                    Required Files
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.requiredFiles.map((file) => (
                      <span
                        key={file}
                        className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-xs font-medium text-[#59645d]"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-w-[220px] flex-col gap-2">
                <button
                  type="button"
                  onClick={() => updateReadiness(item.id, "Ready")}
                  className="rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                >
                  Ready for Defense
                </button>

                <button
                  type="button"
                  onClick={() => updateReadiness(item.id, "Not Ready")}
                  className="rounded-lg border border-[#dfe8df] px-4 py-2.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Not Ready
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#7b877f]">
              No defense endorsements found for the selected filters.
            </p>
          </Card>
        )}
      </div>
    </AdviserShell>
  );
}
