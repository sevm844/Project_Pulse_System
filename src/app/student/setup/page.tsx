"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CapstoneGroup } from "../../_lib/firebase";
import {
  acceptGroupInvitation,
  findGroupInvitationForEmail,
  hasAcceptedGroupInvitation,
} from "../../_utils/groupAssignmentStorage";
import {
  getStoredUserEmail,
  getStoredUserUid,
} from "../../_utils/authStorage";
import {
  getStoredStudentGroup,
  saveStoredStudentGroup,
} from "../_utils/studentGroupStorage";
import Card from "../_components/Card";

function getInitialInvitation() {
  return findGroupInvitationForEmail(getStoredUserEmail());
}

function getMemberName(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StudentSetupPage() {
  const router = useRouter();
  const [studentEmail] = useState(() => getStoredUserEmail());
  const [studentUid] = useState(() => getStoredUserUid());
  const [invitation, setInvitation] = useState<CapstoneGroup | null>(() =>
    getInitialInvitation(),
  );
  const [acceptedGroup] = useState(() => getStoredStudentGroup());

  const invitationAccepted = invitation
    ? hasAcceptedGroupInvitation(invitation.id)
    : false;

  function refreshAssignmentStatus() {
    setInvitation(findGroupInvitationForEmail(studentEmail));
  }

  function handleAcceptInvitation() {
    if (!invitation || !studentEmail) return;

    const normalizedEmail = studentEmail.toLowerCase();
    const nextGroup: CapstoneGroup = {
      ...invitation,
      members: invitation.members.map((member) =>
        member.email.toLowerCase() === normalizedEmail
          ? {
              ...member,
              uid: studentUid || member.uid,
              name: member.name || getMemberName(member.email),
            }
          : member,
      ),
      updatedAt: new Date().toISOString(),
    };

    acceptGroupInvitation(invitation.id);
    saveStoredStudentGroup(nextGroup);
    router.push("/student");
  }

  function continueToDashboard() {
    if (acceptedGroup) {
      router.push("/student");
      return;
    }

    if (invitation && invitationAccepted) {
      saveStoredStudentGroup(invitation);
      router.push("/student");
    }
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

            {!invitation && !acceptedGroup && (
              <Card className="border-[#dfe3eb] bg-white/86 p-6 shadow-[0_20px_55px_rgba(23,28,25,0.08)] backdrop-blur-xl">
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

                <button
                  type="button"
                  onClick={refreshAssignmentStatus}
                  className="mt-6 w-full rounded-lg bg-[#123f2b] py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(18,63,43,0.22)] transition hover:bg-[#0f3324]"
                >
                  Refresh Assignment Status
                </button>
              </Card>
            )}

            {invitation && !invitationAccepted && (
              <Card className="border-[#dfe3eb] bg-white/86 p-6 shadow-[0_20px_55px_rgba(23,28,25,0.08)] backdrop-blur-xl">
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
                      {invitation.groupName}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                      Project Title
                    </p>
                    <p className="mt-2 font-bold text-[#171c19]">
                      {invitation.projectTitle}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                        Adviser
                      </p>
                      <p className="mt-2 font-bold text-[#171c19]">
                        {invitation.adviserName}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b877f]">
                        Course & Section
                      </p>
                      <p className="mt-2 font-bold text-[#171c19]">
                        {invitation.course} {invitation.section}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAcceptInvitation}
                  className="mt-6 w-full rounded-lg bg-[#123f2b] py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(18,63,43,0.22)] transition hover:bg-[#0f3324]"
                >
                  Accept and Continue to Dashboard
                </button>
              </Card>
            )}

            {(acceptedGroup || (invitation && invitationAccepted)) && (
              <Card className="border-[#dfe3eb] bg-white/86 p-6 shadow-[0_20px_55px_rgba(23,28,25,0.08)] backdrop-blur-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3a7f35]">
                  Group Assignment Confirmed
                </p>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#171c19]">
                  Your capstone group is already confirmed.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#4d5751]">
                  You can continue to your dashboard and access your project
                  workspace, submissions, feedback, and defense preparation.
                </p>

                <button
                  type="button"
                  onClick={continueToDashboard}
                  className="mt-6 w-full rounded-lg bg-[#123f2b] py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(18,63,43,0.22)] transition hover:bg-[#0f3324]"
                >
                  Continue to Dashboard
                </button>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
