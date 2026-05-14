"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../_lib/firebase";
import StakeholderCalendar from "../_components/StakeholderCalendar";
import {
  clearStoredUserSession,
  getStoredUserEmail,
} from "../_utils/authStorage";

const calendarCategories = ["Validation", "Submissions", "Monitoring"];
const COORDINATOR_PROFILE_IMAGE_KEY =
  "project-pulse-coordinator-profile-image";

const submissions = [
  {
    id: 1,
    group: "WBS Test Group",
    course: "BSIT 4A",
    file: "Capstone Monitoring Form",
    status: "For Validation",
    requirements: "3/4 complete",
  },
  {
    id: 2,
    group: "ArchiveLink",
    course: "BSIS 4A",
    file: "Final Output Package",
    status: "Validated",
    requirements: "4/4 complete",
  },
];

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState(submissions);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coordinatorEmail, setCoordinatorEmail] = useState(
    "coordinator@ub.edu.ph",
  );

  useEffect(() => {
    const role = localStorage.getItem("project-pulse-user-role");

    if (role !== "Coordinator") {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => setCheckingAccess(false));
  }, [router]);

  useEffect(() => {
    const savedImage = localStorage.getItem(COORDINATOR_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) {
      queueMicrotask(() => setProfileImage(savedImage));
    }

    if (savedEmail) {
      queueMicrotask(() => setCoordinatorEmail(savedEmail));
    }
  }, []);

  async function handleLogout() {
    await signOut(auth);
    clearStoredUserSession();
    router.push("/login");
  }

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setProfileImage(imageData);
      localStorage.setItem(COORDINATOR_PROFILE_IMAGE_KEY, imageData);
    };

    reader.readAsDataURL(file);
  }

  function updateStatus(id: number, status: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#7b877f]">Checking access...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] flex-col justify-between border-r border-[#dfe8df] bg-white px-5 py-6 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logotop.png"
                alt="Project Pulse"
                width={34}
                height={34}
                className="rounded-xl"
              />
              <div>
                <h1 className="text-sm font-semibold tracking-tight">
                  Project Pulse
                </h1>
                <p className="text-xs text-[#7b877f]">Coordinator Portal</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2 text-sm">
              <Link
                href="/coordinator"
                className="flex items-center gap-3 rounded-lg bg-[#d7f7d8] px-3 py-2.5 font-semibold text-[#203028]"
              >
                <Image
                  src="/dashbrd.png"
                  alt=""
                  width={16}
                  height={16}
                  className="opacity-70"
                />
                <span>Dashboard</span>
              </Link>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-left text-xs font-medium text-[#59645d] hover:bg-[#f3f7f1]"
          >
            Log out
          </button>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className="relative z-10 px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-medium text-[#7b877f]">
                  Dashboard & Monitoring
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Coordinator Dashboard
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full rounded-lg border border-[#dfe8df] bg-[#f8faf7] px-3 py-2 md:w-72">
                  <input
                    placeholder="Search coordinator workspace..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
                  />
                </div>

                <Link
                  href="/coordinator"
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                >
                  Notifications
                </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">Coordinator</p>
                    <p className="text-[10px] text-[#7b877f]">
                      {coordinatorEmail}
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
                      {!profileImage && "CO"}
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
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-3">
                  {[
                    [
                      "Pending Validation",
                      items.filter((item) => item.status === "For Validation")
                        .length,
                    ],
                    [
                      "Completed Checks",
                      items.filter((item) => item.status === "Validated")
                        .length,
                    ],
                    ["Final Outputs", items.length],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm"
                    >
                      <p className="text-xs text-[#7b877f]">{label}</p>
                      <p className="mt-3 text-3xl font-semibold text-[#203028]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
                  <div className="border-b border-[#edf2ec] p-5">
                    <h2 className="text-lg font-semibold text-[#203028]">
                      Submission Validation
                    </h2>
                    <p className="mt-1 text-sm text-[#7b877f]">
                      Validate submissions, check requirements, and manage final
                      output records.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                        <tr>
                          <th className="px-5 py-3 font-medium">Group</th>
                          <th className="px-5 py-3 font-medium">Course</th>
                          <th className="px-5 py-3 font-medium">Submission</th>
                          <th className="px-5 py-3 font-medium">
                            Requirements
                          </th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#edf2ec]">
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-5 py-4 font-semibold">
                              {item.group}
                            </td>
                            <td className="px-5 py-4 text-[#59645d]">
                              {item.course}
                            </td>
                            <td className="px-5 py-4 text-[#59645d]">
                              {item.file}
                            </td>
                            <td className="px-5 py-4 text-[#59645d]">
                              {item.requirements}
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-xs font-semibold">
                                {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  updateStatus(item.id, "Validated")
                                }
                                className="rounded-lg bg-[#202823] px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Validate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="xl:sticky xl:top-6 xl:self-start">
                <StakeholderCalendar
                  title="Coordinator Calendar"
                  storageKey="project-pulse-coordinator-calendar-notes"
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
