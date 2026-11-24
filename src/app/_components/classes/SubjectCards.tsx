"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { enrollWithCode, fetchClasses, subjectLabel, type ApiClass } from "../../_lib/classes";
import { errorMessage } from "../../_lib/groups";

// The student's subjects as cards, like the dashboard of the school's learning system, with the Enroll button: type the code from the teacher
// (the adviser for AppDev, the Dean for CAP101-2) and the card appears.
export default function SubjectCards() {
  const [classes, setClasses] = useState<ApiClass[] | null>(null);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setClasses(await fetchClasses());
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load your subjects."));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function enroll(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const joined = await enrollWithCode(code.trim());
      setCode("");
      setEnrolling(false);
      setMessage(`You are enrolled in ${subjectLabel(joined.subject_code)} · ${joined.name}.`);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Unable to enroll."));
    }

    setBusy(false);
  }

  return (
    <section aria-label="My subjects" className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#203028]">My subjects</h2>
          <p className="mt-0.5 text-sm text-[#7b877f]">Your adviser gives you the AppDev code. The Dean gives you the CAP101-2 code.</p>
        </div>
        {!enrolling && (
          <button
            type="button"
            onClick={() => setEnrolling(true)}
            className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            Enroll in a subject
          </button>
        )}
      </div>

      {enrolling && (
        <form onSubmit={enroll} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-[#dfe8df] bg-[#f8faf7] p-4">
          <label className="block text-xs font-semibold text-[#203028]">
            Class code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="For example K7M2QX"
              maxLength={20}
              autoFocus
              required
              className="mt-1 block w-56 rounded-lg border border-[#dfe3eb] bg-white px-3 py-2 text-sm font-normal uppercase tracking-widest text-[#203028] outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]"
            />
          </label>
          <button type="submit" disabled={busy || !code.trim()} className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50">
            {busy ? "Enrolling..." : "Enroll"}
          </button>
          <button type="button" onClick={() => { setEnrolling(false); setCode(""); setError(""); }} className="rounded-lg border border-[#dfe3eb] bg-white px-4 py-2.5 text-xs font-semibold text-[#203028] hover:bg-[#f4f6f3]">
            Cancel
          </button>
        </form>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-[#1d6b34]">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {classes === null && !error && <p className="mt-5 text-sm text-[#7b877f]">Loading your subjects...</p>}

      {classes !== null && classes.length === 0 && (
        <p className="mt-5 rounded-xl border border-dashed border-[#dfe8df] px-4 py-6 text-center text-sm text-[#7b877f]">
          You are not enrolled in any subject yet. Press <span className="font-semibold text-[#203028]">Enroll in a subject</span> and type the code from your teacher.
        </p>
      )}

      {classes !== null && classes.length > 0 && (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((item) => (
            <li key={item.class_id}>
              <Link
                href={`/student/subjects/${item.class_id}`}
                className="group block overflow-hidden rounded-xl border border-[#dfe8df] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(18,63,43,0.12)]"
              >
                <div
                  className="flex h-28 items-end bg-[#123f2b] bg-cover bg-center px-4 pb-3"
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(18,63,43,0.88), rgba(18,63,43,0.2)), url(${item.subject_code === "APPDEV" ? "/subjects/appdev.webp" : "/subjects/capstone.jpg"})`,
                  }}
                >
                  <div>
                    <p className="text-xl font-extrabold tracking-tight text-white">{subjectLabel(item.subject_code)}</p>
                    <p className="text-[11px] font-semibold text-white/80">{item.subject_name}</p>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#203028] group-hover:text-[#123f2b]">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[#7b877f]">{item.teacher}</p>
                  <p className="mt-0.5 truncate text-xs text-[#9aa59e]">
                    {item.school_year} · {item.semester}
                    {item.group_name ? ` · ${item.group_name}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
