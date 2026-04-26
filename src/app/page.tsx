import Image from "next/image";

const announcements = [
  "Coordinator announcements and official academic updates will appear here.",
  "Submission reminders, defense schedules, and requirement notices can be posted here.",
  "Archive and records-related notices may also be shared once the system is fully deployed.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 bg-white/90 backdrop-blur border-b">
        <div className="flex items-center gap-3">
          <Image
            src="/logotop.png"
            alt="Project Pulse Logo"
            width={34}
            height={34}
          />
          <span className="text-lg font-semibold tracking-tight">
            Project <span className="text-green-600">Pulse</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#about" className="hover:text-gray-900">
            About
          </a>
          <a href="#about" className="hover:text-gray-900">
            CICT
          </a>
          <a href="#announcements" className="hover:text-gray-900">
            Announcements
          </a>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <a
            href="/login"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Log in
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center translate-y-[-20px] text-center px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="hidden xl:block absolute left-3 top-8 rotate-[-6deg]">
          <Image
            src="/pinNote.png"
            alt="Sticky note"
            width={250}
            height={380}
            className="h-auto object-contain"
            priority
          />
        </div>

        <div className="hidden xl:block absolute left-[100px] bottom-[-30px] rotate-[-1deg]">
          <Image
            src="/tasks.png"
            alt="Task card"
            width={300}
            height={550}
            className="h-auto object-contain"
            priority
          />
        </div>

        <div className="hidden xl:block absolute right-[100px] bottom-[-60px] rotate-[-1deg]">
          <Image
            src="/icons.png"
            alt="Icons card"
            width={300}
            height={550}
            className="h-auto object-contain"
            priority
          />
        </div>

        <div className="hidden xl:block absolute right-3 top-8 rotate-[6deg]">
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
          <div className="absolute inset-0 bg-green-100 blur-2xl opacity-50 rounded-full" />
          <div className="relative w-20 h-20 mx-auto bg-white rounded-2xl shadow-md flex items-center justify-center">
            <Image
              src="/logo-icon.png"
              alt="Project Pulse Icon"
              width={40}
              height={40}
            />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-medium tracking-tight max-w-4xl mx-auto leading-tight">
          <span className="block">Unified Capstone Lifecycle</span>
          <span className="block text-green-600">Management</span>
        </h1>

        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
          Explore completed capstone projects, stay updated with announcements,
          and access Project Pulse services.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#archive"
            className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 shadow-sm"
          >
            Browse Archive
          </a>
          <a
            href="/register"
            className="px-6 py-3 border border-gray-300 rounded-md font-medium hover:bg-gray-100"
          >
            Create Account
          </a>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 md:px-8 py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <div className="bg-white border rounded-2xl shadow-sm p-8">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-[0.2em]">
              About Project Pulse
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Project Pulse Overview
            </h2>
            <p className="mt-4 text-gray-600 leading-7">
              Project Pulse is a centralized capstone lifecycle management system that streamlines submissions, 
              feedback, scheduling, and final approvals. It enables stakeholders to track progress, manage document versions, 
              and ensure that all requirements are completed through structured stages.
            </p>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-8">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-[0.2em]">
              Department Information
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              College of Information and Communication Technology 
            </h2>
            <p className="mt-4 text-gray-600 leading-7">
                The College of Information and Communication Technology supports the development of research, 
                innovation, and capstone projects by guiding students through structured academic processes. 
                Through Project Pulse, the department can strengthen project monitoring, improve coordination among 
                stakeholders, and support the proper management of capstone outputs.

            </p>
          </div>
        </div>
      </section>

      {/* ARCHIVE SEARCH */}
      <section id="archive" className="px-6 md:px-8 py-16 bg-white border-y">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-[0.2em]">
              Archive Repository
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Search completed capstone projects
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Browse approved capstone outputs and filter results by year,
              program, adviser, or keywords.
            </p>
          </div>

          {/* SEARCH + FILTERS */}
          <div className="bg-gray-50 border rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search by title or keyword"
                className="lg:col-span-2 px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-200"
              />

              <select className="px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-200">
                <option>Year</option>
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
              </select>

              <select className="px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-200">
                <option>Department / Program</option>
                <option>BS Information Technology</option>
                <option>BS Computer Science</option>
                <option>BS Library and Information Science</option>
                <option>Associate in Computer Technology</option>
              </select>

              <input
                type="text"
                placeholder="Adviser"
                className="px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700">
                Search
              </button>
              <button className="px-5 py-2.5 border border-gray-300 rounded-md hover:bg-gray-100">
                Reset Filters
              </button>
              <a
                href="/archive"
                className="px-5 py-2.5 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                View Full Archive
              </a>
            </div>
          </div>

          {/* EMPTY ARCHIVE STATE */}
          <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">
            <h3 className="text-xl font-semibold mb-3">
              No archived projects yet
            </h3>
            <p className="text-gray-500 max-w-2xl mx-auto leading-7">
              Completed and approved capstone projects will appear here once the
              archive repository becomes available.
            </p>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      <section id="announcements" className="px-6 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-[0.2em]">
              Announcements
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Latest updates
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Dean and Coordinator can post important updates, reminders, and
              notices for students and faculty.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {announcements.map((item, index) => (
              <div
                key={index}
                className="bg-white border rounded-2xl p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-green-600 mb-3">
                  Announcement {index + 1}
                </p>
                <p className="text-gray-600 leading-7">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOGIN INFO */}
      <section className="px-6 md:px-8 pb-20">
        <div className="max-w-4xl mx-auto bg-green-600 text-white rounded-3xl p-10 text-center shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Access your role-based dashboard
          </h2>
          <p className="mt-3 text-green-50 max-w-2xl mx-auto">
            Students, advisers, panelists, coordinators, grammarians, records
            staff, and administrators can sign in to access their assigned
            workflows.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="/register"
              className="px-6 py-3 bg-white text-green-700 rounded-md font-medium hover:bg-green-50"
            >
              Create Account
            </a>
            <a
              href="/contact"
              className="px-6 py-3 border border-white/40 rounded-md font-medium hover:bg-white/10"
            >
              Help / Contact Admin
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white px-6 md:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Project Pulse</p>
          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-gray-900">
              About
            </a>
            <a href="#archive" className="hover:text-gray-900">
              Archive
            </a>
            <a href="#announcements" className="hover:text-gray-900">
              Announcements
            </a>
            <a href="/login" className="hover:text-gray-900">
              Login
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}