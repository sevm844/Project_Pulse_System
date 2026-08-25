"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import DashboardSearchIcon from "../_components/DashboardSearchIcon";
import SidebarToggle from "../_components/SidebarToggle";
import StakeholderCalendar from "../_components/StakeholderCalendar";
import { getStoredUserEmail } from "../_utils/authStorage";

const calendarCategories = ["Validation", "Archive", "Repository"];
const RECORDS_PROFILE_IMAGE_KEY = "project-pulse-records-profile-image";
const RECORDS_SIDEBAR_COLLAPSED_KEY = "project-pulse-records-sidebar-collapsed";

export default function RecordsPage() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [recordsEmail, setRecordsEmail] = useState("records@ub.edu.ph");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem(RECORDS_SIDEBAR_COLLAPSED_KEY) === "true";
  });

  useEffect(() => {
    const savedImage = localStorage.getItem(RECORDS_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) {
      queueMicrotask(() => setProfileImage(savedImage));
    }

    if (savedEmail) {
      queueMicrotask(() => setRecordsEmail(savedEmail));
    }
  }, []);

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setProfileImage(imageData);
      localStorage.setItem(RECORDS_PROFILE_IMAGE_KEY, imageData);
    };

    reader.readAsDataURL(file);
  }

  function toggleSidebar() {
    const nextValue = !sidebarCollapsed;

    setSidebarCollapsed(nextValue);
    localStorage.setItem(RECORDS_SIDEBAR_COLLAPSED_KEY, String(nextValue));
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <div className="flex min-h-screen">
        <aside
          className={`relative hidden shrink-0 border-r border-[#dfe8df] bg-white px-5 py-6 lg:block ${
            sidebarCollapsed ? "w-20" : "w-[260px]"
          }`}
        >
          <SidebarToggle
            collapsed={sidebarCollapsed}
            onClick={toggleSidebar}
            variant="panel"
          />
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-2 px-2"
            }`}
          >
            <Image
              src="/logotop.png"
              alt="Project Pulse"
              width={34}
              height={34}
              className="rounded-lg"
            />
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold text-[#203028]">
                Project Pulse
              </span>
            )}
          </div>

          <nav className="mt-8 space-y-2 text-sm">
            <Link
              href="/records"
              title="Dashboard"
              className={`flex items-center rounded-lg bg-[#d7f7d8] font-semibold text-[#203028] ${
                sidebarCollapsed
                  ? "justify-center px-0 py-3"
                  : "gap-3 px-3 py-2.5"
              }`}
            >
              <Image
                src="/dashbrd.png"
                alt=""
                width={16}
                height={16}
                className="opacity-70"
              />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </Link>

            <Link
              href="/records/final-approval"
              title="Final Validation"
              className={`flex items-center rounded-lg font-semibold hover:bg-[#f3f7f1] ${
                sidebarCollapsed
                  ? "justify-center px-0 py-3"
                  : "gap-3 px-3 py-2.5"
              }`}
            >
              <Image src="/checklt.png" alt="" width={16} height={16} className="opacity-70" />
              {!sidebarCollapsed && <span>Final Validation</span>}
            </Link>

            <Link
              href="/records/archive"
              title="Archive"
              className={`flex items-center rounded-lg font-semibold hover:bg-[#f3f7f1] ${
                sidebarCollapsed
                  ? "justify-center px-0 py-3"
                  : "gap-3 px-3 py-2.5"
              }`}
            >
              <Image src="/fold.png" alt="" width={16} height={16} className="opacity-70" />
              {!sidebarCollapsed && <span>Archive</span>}
            </Link>

            <Link
              href="/records/repository"
              title="Repository"
              className={`flex items-center rounded-lg font-semibold hover:bg-[#f3f7f1] ${
                sidebarCollapsed
                  ? "justify-center px-0 py-3"
                  : "gap-3 px-3 py-2.5"
              }`}
            >
              <Image src="/docs.png" alt="" width={16} height={16} className="opacity-70" />
              {!sidebarCollapsed && <span>Repository</span>}
            </Link>
          </nav>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className="relative z-10 px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-medium text-[#7b877f]">
                  Records & Archiving
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Records Overview
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                  <DashboardSearchIcon />

                  <Link
                    href="/records"
                    aria-label="Notifications"
                    title="Notifications"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe8df] bg-white transition hover:bg-[#f3f7f1]"
                  >
                    <Image src="/notif.png" alt="" width={18} height={18} />
                  </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">Records Staff</p>
                    <p className="text-[10px] text-[#7b877f]">
                      {recordsEmail}
                    </p>
                  </div>

                  <label className="group relative cursor-pointer">
                    <div
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#d7f7d8] bg-cover bg-center text-xs font-semibold text-[#203028]"
                      style={
                        profileImage
                          ? { backgroundImage: `url(${profileImage})` }
                          : undefined
                      }
                    >
                      {!profileImage && "RS"}
                    </div>

                    <span className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/50 text-[9px] text-white group-hover:flex">
                      Edit
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#203028]">
                  Records Validation
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#7b877f]">
                  Validate final manuscript, certificates, clearance files, and
                  final requirements before dean approval.
                </p>

                <Link
                  href="/records/final-approval"
                  className="mt-5 inline-flex rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
                >
                  Open Final Validation
                </Link>
              </div>

              <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#203028]">
                  Archive Management
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#7b877f]">
                  Maintain approved final records, final manuscripts,
                  certificates, approval forms, and clearance files.
                </p>

                <Link
                  href="/records/archive"
                  className="mt-5 inline-flex rounded-lg border border-[#dfe8df] px-4 py-2.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Open Archive
                </Link>
              </div>

              <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#203028]">
                  Project Repository
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#7b877f]">
                  Search, filter, and browse completed capstone projects by
                  group, course, status, adviser, and school year.
                </p>

                <Link
                  href="/records/repository"
                  className="mt-5 inline-flex rounded-lg border border-[#dfe8df] px-4 py-2.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Open Repository
                </Link>
              </div>
              </div>

              <div className="xl:sticky xl:top-6 xl:self-start">
                <StakeholderCalendar
                  title="Records Calendar"
                  storageKey="project-pulse-records-calendar-notes"
                  categories={calendarCategories}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
