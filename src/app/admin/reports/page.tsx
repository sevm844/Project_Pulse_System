"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";
import Card from "../_components/Card";
import {
  getArchivedProjects,
  type ArchivedProject,
} from "../../_utils/archiveStorage";

export default function AdminReportsPage() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);

  useEffect(() => {
    setProjects(getArchivedProjects());
  }, []);

  const courseCounts = useMemo(() => {
    return projects.reduce<Record<string, number>>((counts, project) => {
      const course = project.course.split(" ")[0];
      counts[course] = (counts[course] || 0) + 1;
      return counts;
    }, {});
  }, [projects]);

  return (
    <AdminShell title="Reports">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Records & Archive Reports
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Summary of archived final projects and maintained repository
            records.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Archived Projects", projects.length],
            ["Stored Final Documents", projects.length * 4],
            ["School Year", projects[0]?.schoolYear || "2025-2026"],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#203028]">
                {value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Archived Projects by Course
            </h3>

            <div className="mt-5 space-y-3">
              {Object.entries(courseCounts).map(([course, count]) => (
                <div
                  key={course}
                  className="flex items-center justify-between rounded-xl bg-[#f8faf7] p-4"
                >
                  <p className="text-sm font-semibold text-[#203028]">
                    {course}
                  </p>
                  <p className="text-sm font-semibold text-[#4f8f58]">
                    {count} archived
                  </p>
                </div>
              ))}

              {Object.keys(courseCounts).length === 0 && (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  No archived projects yet.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Recent Archive Records
            </h3>

            <div className="mt-5 space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="rounded-xl bg-[#f8faf7] p-4">
                  <p className="text-sm font-semibold text-[#203028]">
                    {project.groupName}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {project.course} • {project.projectTitle}
                  </p>
                  <p className="mt-1 text-xs text-[#4f8f58]">
                    Archived {project.archivedAt}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
