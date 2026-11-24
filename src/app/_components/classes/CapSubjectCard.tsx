"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ApiClass } from "../../_lib/classes";

// The Panelist, the Grammarian and the Dean's Secretary have no class of their own: their work belongs to the Dean's subject, CAP101-2.
// This card shows that subject (read only), like the card a student sees.
export default function CapSubjectCard({ note }: { note: string }) {
  const [classes, setClasses] = useState<ApiClass[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchClasses()
      .then((items) => {
        if (!cancelled) setClasses(items.filter((item) => item.subject_code === "CAP101-2"));
      })
      .catch(() => {
        /* the card is only a hint: nothing is shown if it cannot be loaded */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (classes.length === 0) return null;

  return (
    <section aria-label="Your subject" className="mb-5 overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
      {classes.map((item) => (
        <div key={item.class_id} className="flex flex-wrap items-stretch">
          <div className="flex min-w-48 flex-col justify-end bg-[#3a7f35] px-5 py-4">
            <p className="text-xl font-extrabold tracking-tight text-white">CAP101-2</p>
            <p className="text-[11px] font-semibold text-white/80">{item.subject_name}</p>
          </div>
          <div className="min-w-0 flex-1 px-5 py-4">
            <p className="text-sm font-semibold text-[#203028]">
              {item.name} · {item.teacher}
            </p>
            <p className="mt-0.5 text-xs text-[#9aa59e]">
              {item.school_year} · {item.semester} · {item.students_count} {item.students_count === 1 ? "student" : "students"} enrolled
            </p>
            <p className="mt-2 text-xs leading-5 text-[#59645d]">{note}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
