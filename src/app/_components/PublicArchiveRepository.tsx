"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getArchivedProjects,
  type ArchivedProject,
} from "../_utils/archiveStorage";

type PublicArchiveRepositoryProps = {
  preview?: boolean;
};

const years = ["All", "2025-2026"] as const;
const programs = ["All", "BSIT", "BSCS", "BSIS"] as const;

export default function PublicArchiveRepository({
  preview = false,
}: PublicArchiveRepositoryProps) {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [year, setYear] = useState<(typeof years)[number]>("All");
  const [program, setProgram] = useState<(typeof programs)[number]>("All");
  const [adviser, setAdviser] = useState("");

  useEffect(() => {
    setProjects(getArchivedProjects());
  }, []);

  const advisers = useMemo(() => {
    const names = projects.map((project) => project.adviser).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [projects]);

  const visibleProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = projects.filter((project) => {
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

      const matchesYear = year === "All" || project.schoolYear === year;
      const matchesProgram =
        program === "All" || project.course.startsWith(program);
      const matchesAdviser = !adviser || adviser === "All" || project.adviser === adviser;

      return matchesSearch && matchesYear && matchesProgram && matchesAdviser;
    });

    return preview ? filtered.slice(0, 3) : filtered;
  }, [adviser, preview, program, projects, searchQuery, year]);

  function resetFilters() {
    setSearchQuery("");
    setYear("All");
    setProgram("All");
    setAdviser("");
  }

  return (
    <section className="bg-[#fbfdfb] px-6 py-20 text-[#102018]">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#4f8f58]">
            Archive Repository
          </p>
          <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Search completed capstone projects
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#6b766f] md:text-lg">
            Browse approved capstone outputs and filter results by year,
            program, adviser, or keywords.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm md:p-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px_260px_260px]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, group, or keyword"
              className="rounded-lg border border-[#dfe8df] px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            />

            <select
              value={year}
              onChange={(event) =>
                setYear(event.target.value as (typeof years)[number])
              }
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-4 text-sm outline-none"
            >
              {years.map((item) => (
                <option key={item}>{item === "All" ? "Year" : item}</option>
              ))}
            </select>

            <select
              value={program}
              onChange={(event) =>
                setProgram(event.target.value as (typeof programs)[number])
              }
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-4 text-sm outline-none"
            >
              {programs.map((item) => (
                <option key={item}>
                  {item === "All" ? "Department / Program" : item}
                </option>
              ))}
            </select>

            <select
              value={adviser || "All"}
              onChange={(event) => setAdviser(event.target.value)}
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-4 text-sm outline-none"
            >
              {advisers.map((item) => (
                <option key={item}>{item === "All" ? "Adviser" : item}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-[#202823] px-6 py-3 text-sm font-semibold text-white hover:bg-[#303a33]"
            >
              Search
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-[#dfe8df] px-6 py-3 text-sm font-semibold hover:bg-[#f3f7f1]"
            >
              Reset Filters
            </button>

            {preview && (
              <Link
                href="/archive"
                className="rounded-lg border border-[#dfe8df] px-6 py-3 text-sm font-semibold hover:bg-[#f3f7f1]"
              >
                View Full Archive
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10">
          {visibleProjects.length === 0 ? (
            <div className="rounded-2xl border border-[#dfe8df] bg-white px-6 py-14 text-center shadow-sm">
              <h3 className="text-xl font-bold text-[#102018]">
                No archived projects yet
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6b766f]">
                Completed and approved capstone projects will appear here once
                the archive repository becomes available.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f8f58]">
                      {project.course}
                    </p>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {project.schoolYear}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold leading-7 text-[#102018]">
                    {project.projectTitle}
                  </h3>

                  <p className="mt-3 text-sm text-[#59645d]">
                    {project.groupName}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-[#6b766f]">
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Adviser:
                      </span>{" "}
                      {project.adviser}
                    </p>
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Archived:
                      </span>{" "}
                      {project.archivedAt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
