"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getArchivedProjects,
  type ArchivedProject,
} from "../../_utils/archiveStorage";

export default function RecordsArchivePage() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);

  useEffect(() => {
    setProjects(getArchivedProjects());
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] border-r border-[#dfe8df] bg-white px-5 py-6 lg:block">
          <h1 className="text-sm font-semibold">Project Pulse</h1>
          <p className="text-xs text-[#7b877f]">Records Staff Portal</p>

          <nav className="mt-8 space-y-2 text-sm">
            <Link
              href="/records"
              className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-[#f3f7f1]"
            >
              Dashboard
            </Link>
            <Link
              href="/records/final-approval"
              className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-[#f3f7f1]"
            >
              Final Validation
            </Link>
            <Link
              href="/records/archive"
              className="block rounded-lg bg-[#d7f7d8] px-3 py-2.5 font-semibold"
            >
              Archive
            </Link>
            <Link
              href="/records/repository"
              className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-[#f3f7f1]"
            >
              Repository
            </Link>
          </nav>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className="relative z-10 px-6 py-6 lg:px-8">
            <p className="text-[11px] font-medium text-[#7b877f]">
              Records & Archiving
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Archive Management
            </h1>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                ["Archived Projects", projects.length],
                ["Final Documents", projects.length * 4],
                [
                  "School Year",
                  projects[0]?.schoolYear || "2025-2026",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm"
                >
                  <p className="text-xs text-[#7b877f]">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-[#203028]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
              <div className="border-b border-[#edf2ec] p-5">
                <h2 className="text-lg font-semibold text-[#203028]">
                  Archived Final Documents
                </h2>
                <p className="mt-1 text-sm text-[#7b877f]">
                  Maintain final manuscripts, certificates, approval forms, and
                  clearance records.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Group</th>
                      <th className="px-5 py-3 font-medium">Project</th>
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-5 py-3 font-medium">Archived</th>
                      <th className="px-5 py-3 font-medium">Records</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf2ec]">
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-5 py-4 font-semibold text-[#203028]">
                          {project.groupName}
                        </td>
                        <td className="px-5 py-4 text-[#59645d]">
                          {project.projectTitle}
                        </td>
                        <td className="px-5 py-4 text-[#59645d]">
                          {project.course}
                        </td>
                        <td className="px-5 py-4 text-[#59645d]">
                          {project.archivedAt}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {[
                              project.finalManuscript,
                              project.grammarCertificate,
                              project.approvalForm,
                              project.recordsClearance,
                            ].map((file) => (
                              <span
                                key={file}
                                className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-[11px] font-medium text-[#59645d]"
                              >
                                {file}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
