import Image from "next/image";

const announcements = [
  "Coordinator announcements and official academic updates will appear here.",
  "Submission reminders, defense schedules, and requirement notices can be posted here.",
  "Archive and records-related notices may also be shared once the system is fully deployed.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
{/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#edf2ec] bg-white/90 px-6 py-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logotop.png"
            alt="Project Pulse Logo"
            width={34}
            height={34}
            className="rounded-xl"
          />

          <span className="text-lg font-semibold tracking-tight">
            Project <span className="text-[#4f8f58]">Pulse</span>
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-[#59645d] md:flex">
          <a href="#about" className="transition hover:text-[#1f2a24]">
            About
          </a>
          <a href="#about" className="transition hover:text-[#1f2a24]">
            CICT
          </a>
          <a
            href="#announcements"
            className="transition hover:text-[#1f2a24]"
          >
            Announcements
          </a>
        </nav>

        <a
          href="/login"
          className="rounded-lg border border-[#dfe8df] px-4 py-2 text-sm font-medium text-[#203028] transition hover:bg-[#f3f7f1]"
        >
          Log in
        </a>
      </header>

{/* Hero */}
      <section className="relative flex min-h-screen translate-y-[-20px] flex-col items-center justify-center overflow-hidden px-6 pb-40 text-center">
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(#dfe8df_1px,transparent_1px)] opacity-45 [background-size:22px_22px]" />

        <div className="absolute left-3 top-8 hidden rotate-[-6deg] xl:block">
          <Image
            src="/pinNote.png"
            alt="Sticky note"
            width={250}
            height={380}
            className="h-auto object-contain"
            priority
          />
        </div>

        <div className="absolute bottom-[-30px] left-[100px] hidden rotate-[-1deg] xl:block">
          <Image
            src="/tasks.png"
            alt="Task card"
            width={300}
            height={550}
            className="h-auto object-contain"
            priority
          />
        </div>

        <div className="absolute bottom-[-60px] right-[100px] hidden rotate-[-1deg] xl:block">
          <Image
            src="/icons.png"
            alt="Icons card"
            width={300}
            height={550}
            className="h-auto object-contain"
            priority
          />
        </div>

        <div className="absolute right-3 top-8 hidden rotate-[6deg] xl:block">
          <Image
            src="/activity.png"
            alt="Reminder card"
            width={290}
            height={380}
            className="h-auto object-contain"
            priority
          />
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-[#d7f7d8] opacity-60 blur-2xl" />
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-[0_16px_40px_rgba(31,42,36,0.12)]">
            <Image
              src="/logo-icon.png"
              alt="Project Pulse Icon"
              width={40}
              height={40}
            />
          </div>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-medium leading-tight tracking-tight md:text-6xl">
          <span className="block">Unified Capstone Lifecycle</span>
          <span className="block text-[#4f8f58]">Management</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#59645d]">
          Explore completed capstone projects, stay updated with announcements,
          and access Project Pulse services.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#archive"
            className="rounded-lg bg-[#202823] px-6 py-3 font-medium text-white shadow-sm transition hover:bg-[#303a33]"
          >
            Browse Archive
          </a>
          <a
            href="/register"
            className="rounded-lg border border-[#dfe8df] bg-white/70 px-6 py-3 font-medium text-[#203028] transition hover:bg-[#f3f7f1]"
          >
            Create Account
          </a>
        </div>
      </section>

{/* About */}
      <section id="about" className="px-6 py-16 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#dfe8df] bg-white/80 p-8 shadow-[0_1px_2px_rgba(31,42,36,0.04)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4f8f58]">
              About Project Pulse
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Project Pulse Overview
            </h2>

            <p className="mt-4 leading-7 text-[#59645d]">
              Project Pulse is a centralized capstone lifecycle management
              system that streamlines submissions, feedback, scheduling, and
              final approvals. It enables stakeholders to track progress, manage
              document versions, and ensure that all requirements are completed
              through structured stages.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe8df] bg-white/80 p-8 shadow-[0_1px_2px_rgba(31,42,36,0.04)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4f8f58]">
              Department Information
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              College of Information and Communication Technology
            </h2>

            <p className="mt-4 leading-7 text-[#59645d]">
              The College of Information and Communication Technology supports
              the development of research, innovation, and capstone projects by
              guiding students through structured academic processes. Through
              Project Pulse, the department can strengthen project monitoring,
              improve coordination among stakeholders, and support the proper
              management of capstone outputs.
            </p>
          </div>
        </div>
      </section>

{/* Archive */}
      <section
        id="archive"
        className="border-y border-[#edf2ec] bg-[#fbfdfb] px-6 py-16 md:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4f8f58]">
              Archive Repository
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Search completed capstone projects
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-[#7b877f]">
              Browse approved capstone outputs and filter results by year,
              program, adviser, or keywords.
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-[0_1px_2px_rgba(31,42,36,0.04)]">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <input
                type="text"
                placeholder="Search by title or keyword"
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-[#d7f7d8] lg:col-span-2"
              />

              <select className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-[#d7f7d8]">
                <option>Year</option>
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
              </select>

              <select className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-[#d7f7d8]">
                <option>Department / Program</option>
                <option>BS Information Technology</option>
                <option>BS Computer Science</option>
                <option>BS Library and Information Science</option>
                <option>Associate in Computer Technology</option>
              </select>

              <input
                type="text"
                placeholder="Adviser"
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-lg bg-[#202823] px-5 py-2.5 text-white transition hover:bg-[#303a33]">
                Search
              </button>
              <button className="rounded-lg border border-[#dfe8df] px-5 py-2.5 text-[#203028] transition hover:bg-[#f3f7f1]">
                Reset Filters
              </button>
              <a
                href="/archive"
                className="rounded-lg border border-[#dfe8df] px-5 py-2.5 text-[#203028] transition hover:bg-[#f3f7f1]"
              >
                View Full Archive
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dfe8df] bg-white p-10 text-center shadow-[0_1px_2px_rgba(31,42,36,0.04)]">
            <h3 className="mb-3 text-xl font-semibold">
              No archived projects yet
            </h3>

            <p className="mx-auto max-w-2xl leading-7 text-[#7b877f]">
              Completed and approved capstone projects will appear here once the
              archive repository becomes available.
            </p>
          </div>
        </div>
      </section>

{/* Announcements */}
      <section id="announcements" className="px-6 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4f8f58]">
              Announcements
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Latest updates
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-[#7b877f]">
              Dean and Coordinator can post important updates, reminders, and
              notices for students and faculty.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {announcements.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
              >
                <p className="mb-3 text-sm font-medium text-[#4f8f58]">
                  Announcement {index + 1}
                </p>

                <p className="leading-7 text-[#59645d]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* Role access */}
      <section className="px-6 pb-20 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#202823] p-10 text-center text-white shadow-[0_24px_70px_rgba(31,42,36,0.18)]">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Access your role-based dashboard
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-white/75">
            Students, advisers, panelists, coordinators, grammarians, records
            staff, and administrators can sign in to access their assigned
            workflows.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="/register"
              className="rounded-lg bg-white px-6 py-3 font-medium text-[#203028] transition hover:bg-[#f3f7f1]"
            >
              Create Account
            </a>

            <a
              href="/contact"
              className="rounded-lg border border-white/25 px-6 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Help / Contact Admin
            </a>
          </div>
        </div>
      </section>

{/* Footer */}
      <footer className="border-t border-[#edf2ec] bg-white px-6 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[#7b877f] md:flex-row">
          <p>© {new Date().getFullYear()} Project Pulse</p>

          <div className="flex items-center gap-6">
            <a href="#about" className="transition hover:text-[#1f2a24]">
              About
            </a>

            <a href="#archive" className="transition hover:text-[#1f2a24]">
              Archive
            </a>

            <a
              href="#announcements"
              className="transition hover:text-[#1f2a24]"
            >
              Announcements
            </a>

            <a href="/login" className="transition hover:text-[#1f2a24]">
              Login
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
