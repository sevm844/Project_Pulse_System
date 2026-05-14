"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getArchivedProjects,
  type ArchivedProject,
} from "../../_utils/archiveStorage";

const courses = ["All", "BSIT", "BSCS", "BSIS"] as const;
const statuses = ["All", "Archived", "Approved"] as const;

export default function RecordsRepositoryPage() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [course, setCourse] = useState<(typeof courses)[number]>("All");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");

  useEffect(() => {
    setProjects(getArchivedProjects());
  }, []);

  const visibleProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        [
          project.groupName,
          project.projectTitle,
          project.course,
          project.adviser,
          project.schoolYear,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCourse =
        course === "All" || project.course.startsWith(course);

      const matchesStatus = status === "All" || project.status === status;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [course, projects, searchQuery, status]);

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
              className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-[#f3f7f1]"
            >
              Archive
            </Link>
            <Link
              href="/records/repository"
              className="block rounded-lg bg-[#d7f7d8] px-3 py-2.5 font-semibold"
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
              Completed Projects Repository
            </h1>

            <div className="mt-6 rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search group, project, course, adviser, or school year..."
                  className="rounded-lg border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />

                <select
                  value={course}
                  onChange={(event) =>
                    setCourse(event.target.value as (typeof courses)[number])
                  }
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none"
                >
                  {courses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as (typeof statuses)[number])
                  }
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none"
                >
                  {statuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#4f8f58]">
                        {project.course} • {project.schoolYear}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-[#203028]">
                        {project.groupName}
                      </h2>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {project.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#59645d]">
                    {project.projectTitle}
                  </p>

                  <div className="mt-5 space-y-3 text-xs">
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Adviser:
                      </span>{" "}
                      <span className="text-[#59645d]">{project.adviser}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Archived:
                      </span>{" "}
                      <span className="text-[#59645d]">
                        {project.archivedAt}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-xs font-semibold text-[#203028]">
                      Stored Final Records
                    </p>
                    <div className="mt-3 space-y-2 text-xs text-[#59645d]">
                      <p>{project.finalManuscript}</p>
                      <p>{project.grammarCertificate}</p>
                      <p>{project.approvalForm}</p>
                      <p>{project.recordsClearance}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {visibleProjects.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-[#dfe8df] bg-white p-8 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No completed projects found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try another search keyword or filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
