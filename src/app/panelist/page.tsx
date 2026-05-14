"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../_lib/firebase";
import StakeholderCalendar from "../_components/StakeholderCalendar";
import {
  clearStoredUserSession,
  getStoredUserEmail,
} from "../_utils/authStorage";
import {
  computeDefenseAverage,
  computeDefenseResult,
  getStoredDefensePlan,
  saveStoredDefensePlan,
  type DefenseEvaluation,
  type DefensePlan,
} from "../_utils/defenseStorage";

const calendarCategories = ["Defense", "Evaluation", "Documents"];
const PANELIST_PROFILE_IMAGE_KEY = "project-pulse-panelist-profile-image";

export default function PanelistDashboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<DefensePlan | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [panelistEmail, setPanelistEmail] = useState("panelist@ub.edu.ph");

  useEffect(() => {
    const role = localStorage.getItem("project-pulse-user-role");

    if (role !== "Panelist") {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => {
      setPlan(getStoredDefensePlan());
      setCheckingAccess(false);
    });
  }, [router]);

  useEffect(() => {
    const savedImage = localStorage.getItem(PANELIST_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) {
      queueMicrotask(() => setProfileImage(savedImage));
    }

    if (savedEmail) {
      queueMicrotask(() => setPanelistEmail(savedEmail));
    }
  }, []);

  const submittedEvaluations = useMemo(
    () => (plan?.evaluationStatus === "Submitted" ? 1 : 0),
    [plan],
  );

  const pendingEvaluations = useMemo(
    () => (plan?.evaluationStatus === "Pending" ? 1 : 0),
    [plan],
  );

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
      localStorage.setItem(PANELIST_PROFILE_IMAGE_KEY, imageData);
    };

    reader.readAsDataURL(file);
  }

  function updateEvaluation(field: keyof DefenseEvaluation, value: string) {
    if (!plan) return;

    const nextPlan: DefensePlan = {
      ...plan,
      evaluationData: {
        ...plan.evaluationData,
        [field]:
          field === "remarks"
            ? value
            : Math.min(100, Math.max(0, Number(value) || 0)),
      },
    };

    setPlan(nextPlan);
    saveStoredDefensePlan(nextPlan);
  }

  function submitEvaluation() {
    if (!plan) return;

    const nextPlan: DefensePlan = {
      ...plan,
      evaluationStatus: "Submitted",
    };

    setPlan(nextPlan);
    saveStoredDefensePlan(nextPlan);
  }

  if (checkingAccess || !plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#7b877f]">Checking access...</p>
      </main>
    );
  }

  const average = computeDefenseAverage(plan.evaluationData);
  const result = computeDefenseResult(average);

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
                <p className="text-xs text-[#7b877f]">Panelist Portal</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2 text-sm">
              <Link
                href="/panelist"
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
                  Defense Management
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Panelist Dashboard
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full rounded-lg border border-[#dfe8df] bg-[#f8faf7] px-3 py-2 md:w-72">
                  <input
                    placeholder="Search panelist workspace..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
                  />
                </div>

                <Link
                  href="/panelist"
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                >
                  Notifications
                </Link>

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <p className="text-xs font-semibold">Panelist</p>
                    <p className="text-[10px] text-[#7b877f]">
                      {panelistEmail}
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
                      {!profileImage && "PN"}
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
                    ["Assigned Defenses", 1],
                    ["Pending Evaluations", pendingEvaluations],
                    ["Submitted Evaluations", submittedEvaluations],
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

                <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#203028]">
                        {plan.groupName}
                      </h2>
                      <p className="mt-1 text-sm text-[#59645d]">
                        {plan.projectTitle}
                      </p>
                      <p className="mt-3 text-xs text-[#7b877f]">
                        {plan.stage} • {plan.date} • {plan.time}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        Venue: {plan.venue}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        Document: {plan.files[0]?.name || "Defense Package"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/student/documents"
                        className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Access Documents
                      </Link>

                      <button
                        type="button"
                        onClick={submitEvaluation}
                        className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Submit Evaluation
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        ["presentation", "Presentation"],
                        ["documentation", "Documentation"],
                        ["systemDemo", "System Demo"],
                        ["response", "Q&A Response"],
                      ].map(([field, label]) => (
                        <label
                          key={field}
                          className="rounded-xl bg-[#f8faf7] p-4 text-sm font-semibold text-[#203028]"
                        >
                          {label}
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              plan.evaluationData[
                                field as keyof DefenseEvaluation
                              ] as number
                            }
                            onChange={(event) =>
                              updateEvaluation(
                                field as keyof DefenseEvaluation,
                                event.target.value,
                              )
                            }
                            className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none"
                          />
                        </label>
                      ))}

                      <label className="rounded-xl bg-[#f8faf7] p-4 text-sm font-semibold text-[#203028] md:col-span-2">
                        Remarks
                        <textarea
                          value={plan.evaluationData.remarks}
                          onChange={(event) =>
                            updateEvaluation("remarks", event.target.value)
                          }
                          placeholder="Enter panel remarks..."
                          className="mt-2 min-h-24 w-full resize-none rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-5">
                      <p className="text-xs text-[#7b877f]">
                        Evaluation Status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#203028]">
                        {plan.evaluationStatus}
                      </p>

                      <div className="mt-5 rounded-lg bg-white p-4">
                        <p className="text-xs text-[#7b877f]">
                          Computed Average
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-[#203028]">
                          {average}
                        </p>
                      </div>

                      <div className="mt-3 rounded-lg bg-white p-4">
                        <p className="text-xs text-[#7b877f]">
                          Computed Result
                        </p>
                        <p className="mt-2 text-lg font-semibold text-[#4f8f58]">
                          {result}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:sticky xl:top-6 xl:self-start">
                <StakeholderCalendar
                  title="Panelist Calendar"
                  storageKey="project-pulse-panelist-calendar-notes"
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
