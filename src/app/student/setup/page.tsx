"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import {
  errorMessage,
  fetchMyGroup,
  NO_TITLE_YET,
  type ApiGroup,
} from "../../_lib/groups";
import { getStoredUserEmail } from "../../_utils/authStorage";
import Card from "../_components/Card";

const cardClass =
  "border-[#dfe3eb] bg-white/86 p-6 shadow-[0_20px_55px_rgba(23,28,25,0.08)] backdrop-blur-xl";
const buttonClass =
  "mt-6 w-full rounded-lg bg-[#123f2b] py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(18,63,43,0.22)] transition hover:bg-[#0f3324] disabled:opacity-60";

export default function StudentSetupPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  const loadGroup = useCallback(async () => {
    setError("");

    try {
      const myGroup = await fetchMyGroup();

      // Already accepted: nothing to do here, go to the dashboard.
      if (myGroup?.my_membership?.accepted_at) {
        router.replace("/student");
        return;
      }

      setGroup(myGroup);
    } catch (err) {
      setError(errorMessage(err, "Unable to check your group assignment."));
    }

    setLoaded(true);
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => {
      setStudentEmail(getStoredUserEmail());
      void loadGroup();
    });
  }, [loadGroup]);

  async function handleAcceptInvitation() {
    if (!group) return;

    setAccepting(true);
    setError("");

    try {
      await apiFetch(`/groups/${group.group_id}/accept`, { method: "POST" });
      router.push("/student");
    } catch (err) {
      setError(errorMessage(err, "Unable to accept the invitation."));
      setAccepting(false);
    }
  }

  async function refreshAssignmentStatus() {
    setLoaded(false);
    await loadGroup();
  }

  return (
    <main className="min-h-screen bg-[#f9f9ff] text-[#171c19]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(249,249,255,0)_82%),radial-gradient(circle_at_50%_28%,rgba(207,247,236,0.34),rgba(249,249,255,0)_58%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3eb_1px,transparent_1px)] opacity-45 [background-size:24px_24px]" />

        <div className="relative z-10 w-full max-w-5xl">
          <div className="mb-10 flex items-center gap-4">
            <Image
              src="/logotop.png"
              alt="Project Pulse Logo"
              width={58}
              height={58}
              className="rounded-lg"
            />
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-[#171c19]">
                Project <span className="text-[#3a7f35]">Pulse</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-[#4d5751]">
                Student Group Assignment
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3a7f35]">
                Adviser-managed grouping
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-[#171c19] md:text-6xl">
                Your capstone group starts with your adviser.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#4d5751]">
                Group creation is handled by the adviser during the AppDev
                proposal phase. Once your adviser adds you to a group, your
                invitation will appear here and your dashboard will open after
                confirmation.
              </p>
            </div>

            {!loaded && (
              <Card className={cardClass}>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3a7f35]">
                  Checking Assignment
                </p>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#171c19]">
                  Loading your group status...
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#4d5751]">
                  Please wait while Project Pulse checks your student account.
                </p>
              </Card>
            )}

            {loaded && !group && (
              <Card className={cardClass}>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3a7f35]">
                  Pending Group Assignment
                </p>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#171c19]">
                  You have not been added to a capstone group yet.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#4d5751]">
                  Your account is active, but your student dashboard will become
                  available after your adviser creates your group and adds your
                  registered email.
                </p>

                <div className="mt-6 rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                    Logged-in student
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#171c19]">
                    {studentEmail || "No student email found"}
                  </p>
                </div>

                {error && (
                  <p role="alert" className="mt-4 text-sm font-semibold text-[#b42318]">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={refreshAssignmentStatus}
                  className={buttonClass}
                >
                  Refresh Assignment Status
                </button>
              </Card>
            )}

            {loaded && group && (
              <Card className={cardClass}>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3a7f35]">
                  Group Invitation
                </p>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#171c19]">
                  Your adviser added you to a capstone group.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#4d5751]">
                  Review the group details below. Accepting confirms that this
                  is your official group for the proposal defense phase.
                </p>

                <div className="mt-6 grid gap-3 text-sm">
                  <div className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                      Group
                    </p>
                    <p className="mt-2 font-bold text-[#171c19]">
                      {group.group_name}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                      Project Title
                    </p>
                    <p className="mt-2 font-bold text-[#171c19]">
                      {group.project?.project_title || NO_TITLE_YET}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                        Adviser
                      </p>
                      <p className="mt-2 font-bold text-[#171c19]">
                        {group.adviser?.name || "Not assigned"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                        Course & Section
                      </p>
                      <p className="mt-2 font-bold text-[#171c19]">
                        {group.course} {group.section}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="mt-4 text-sm font-semibold text-[#b42318]">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  disabled={accepting}
                  onClick={handleAcceptInvitation}
                  className={buttonClass}
                >
                  {accepting ? "Accepting..." : "Accept and Continue to Dashboard"}
                </button>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
