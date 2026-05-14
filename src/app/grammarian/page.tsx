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

const calendarCategories = ["Reviews", "Certificates", "Deadlines"];
const GRAMMARIAN_PROFILE_IMAGE_KEY =
  "project-pulse-grammarian-profile-image";

const manuscripts = [
  {
    id: 1,
    group: "WBS Test Group",
    project: "WBS Group Management System",
    document: "Final Manuscript Draft",
    status: "For Grammar Review",
    feedback: "",
    certificate: "Not Issued",
  },
  {
    id: 2,
    group: "ArchiveLink",
    project: "Digital Records Request and Archive System",
    document: "Final Manuscript",
    status: "Reviewed",
    feedback: "Minor grammar corrections completed.",
    certificate: "Issued",
  },
];

export default function GrammarianDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState(manuscripts);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [grammarianEmail, setGrammarianEmail] = useState(
    "grammarian@ub.edu.ph",
  );

  useEffect(() => {
    const role = localStorage.getItem("project-pulse-user-role");

    if (role !== "Grammarian") {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => setCheckingAccess(false));
  }, [router]);

  useEffect(() => {
    const savedImage = localStorage.getItem(GRAMMARIAN_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) {
      queueMicrotask(() => setProfileImage(savedImage));
    }

    if (savedEmail) {
      queueMicrotask(() => setGrammarianEmail(savedEmail));
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
      localStorage.setItem(GRAMMARIAN_PROFILE_IMAGE_KEY, imageData);
    };

    reader.readAsDataURL(file);
  }

  function markReviewed(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Reviewed",
              feedback: "Grammar review completed.",
            }
          : item,
      ),
    );
  }

  function issueCertificate(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, certificate: "Issued" } : item,
      ),
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
                <p className="text-xs text-[#7b877f]">Grammarian Portal</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2 text-sm">
              <Link
                href="/grammarian"
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
                  Grammarian Dashboard
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full rounded-lg border border-[#dfe8df] bg-[#f8faf7] px-3 py-2 md:w-72">
                  <input
                    placeholder="Search grammarian workspace..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
                  />
                </div>

                <Link
                  href="/grammarian"
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                >
                  Notifications
                </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">Grammarian</p>
                    <p className="text-[10px] text-[#7b877f]">
                      {grammarianEmail}
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
                      {!profileImage && "GR"}
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
                ["Documents for Review", items.filter((item) => item.status === "For Grammar Review").length],
                ["Feedback Provided", items.filter((item) => item.feedback).length],
                ["Certificates Issued", items.filter((item) => item.certificate === "Issued").length],
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

            <div className="grid gap-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#203028]">
                        {item.group}
                      </h2>
                      <p className="mt-1 text-sm text-[#59645d]">
                        {item.project}
                      </p>
                      <p className="mt-3 text-xs text-[#7b877f]">
                        Document: {item.document}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => markReviewed(item.id)}
                        className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Provide Feedback
                      </button>

                      <button
                        type="button"
                        onClick={() => issueCertificate(item.id)}
                        className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Issue Certificate
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-[#f8faf7] p-4">
                      <p className="text-xs text-[#7b877f]">Review Status</p>
                      <p className="mt-1 text-sm font-semibold">
                        {item.status}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f8faf7] p-4">
                      <p className="text-xs text-[#7b877f]">Feedback</p>
                      <p className="mt-1 text-sm font-semibold">
                        {item.feedback || "No feedback yet"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f8faf7] p-4">
                      <p className="text-xs text-[#7b877f]">Certificate</p>
                      <p className="mt-1 text-sm font-semibold">
                        {item.certificate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              </div>

              <div className="xl:sticky xl:top-6 xl:self-start">
                <StakeholderCalendar
                  title="Grammarian Calendar"
                  storageKey="project-pulse-grammarian-calendar-notes"
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
