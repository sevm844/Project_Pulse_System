"use client";

import Image from "next/image";
import { useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import DefenseWorkspace from "../../_components/DefenseWorkspace";
type CourseOption = {
  code: string;
  name: string;
  icon: string;
};

const courseOptions: CourseOption[] = [
  {
    code: "BSIT",
    name: "Bachelor of Science in Information Technology",
        icon: "/it.png",
  },
  {
    code: "BSIS",
    name: "Bachelor of Science in Information Systems",
        icon: "/is.png",
  },
  {
    code: "BSCS",
    name: "Bachelor of Science in Computer Science",
        icon: "/cs.png",
  },
  {
    code: "ACT",
    name: "Associate in Computer Technology",
        icon: "/act.png",
  },
  {
    code: "BLIS",
    name: "Bachelor of Library and Information Science",
        icon: "/blis.png",
  },
];

const courseCardClass =
  "group rounded-xl border border-[#e2f5df] bg-lime-50/50 p-5 text-left shadow-[0_14px_34px_rgba(31,42,36,0.04)] transition hover:-translate-y-0.5 hover:border-[#a3e635] hover:shadow-[0_18px_42px_rgba(163,230,53,0.1)]"
export default function AdviserDefensePage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(
    null,
  );

  if (!selectedCourse) {
    return (
      <AdviserShell
        title="Defense Workspace"
        subtitle="Open a course folder to publish defense updates for its students."
      >
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courseOptions.map((course) => (
              <button
                key={course.code}
                type="button"
                onClick={() => setSelectedCourse(course)}
                className={courseCardClass}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-19 w-19 shrink-0 items-center justify-center rounded-full bg-[#e9f8df]">
                    <Image
                      src={course.icon}
                      alt=""
                      width={40}
                      height={40}
                      className="opacity-80"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold tracking-tight text-[#17211b]">
                      {course.code}
                    </h2>
                    <p className="mt-1 min-h-[38px] text-sm leading-5 text-[#59645d]">
                      {course.name}
                    </p>
                  </div>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#0f3324]">
                  Open Workspace
                  <span aria-hidden="true">-&gt;</span>
                </div>
              </button>
            ))}
          </div>

        </div>
      </AdviserShell>
    );
  }

  return (
    <AdviserShell title={selectedCourse.code} subtitle="Defense Workspace">
      <div className="flex min-h-[760px] flex-col">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => setSelectedCourse(null)}
              className="mb-2 inline-flex items-center rounded-lg border border-[#9ed58c] px-4 py-2 text-xs font-semibold text-black transition hover:border-[#7abf45]"
              style={{ backgroundColor: "#d7f7c9" }}
            >
              &lt; Course selection
            </button>
            <p className="text-sm text-[#59645d]">{selectedCourse.name}</p>
          </div>
        </div>

        <div className="mt-5">
          <DefenseWorkspace key={selectedCourse.code} adviser courseCode={selectedCourse.code} />
        </div>
      </div>
    </AdviserShell>
  );
}

