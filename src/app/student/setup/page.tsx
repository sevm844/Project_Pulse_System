"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Card from "../_components/Card";
import { saveStoredStudentGroup } from "../_utils/studentGroupStorage";

function generateGroupCode() {
  return `PP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export default function StudentSetupPage() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [members, setMembers] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const memberCount = useMemo(() => {
    return members
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean).length;
  }, [members]);

  // Temporary client-side group setup until database integration is added.
  function handleCreateGroup() {
    const code = generateGroupCode();

    const groupData = {
      groupName: groupName || "Untitled Group",
      projectTitle: projectTitle || "Untitled Project",
      members,
      groupCode: code,
      role: "Group Leader",
    };

    saveStoredStudentGroup(groupData);

    setGeneratedCode(code);
  }

  function handleContinueToDashboard() {
    router.push("/student");
  }

  function handleJoinGroup() {
    const groupData = {
      groupName: "Joined Capstone Group",
      projectTitle: "Smart Capstone Monitoring System",
      members: "Group members will appear after the system syncs.",
      groupCode: joinCode || "PP-DEMO01",
      role: "Member",
    };

    saveStoredStudentGroup(groupData);

    router.push("/student");
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />

        <div className="relative z-10 w-full max-w-6xl">
{/* Brand */}
          <div className="mb-10 flex items-center gap-3">
            <Image
              src="/logotop.png"
              alt="Project Pulse Logo"
              width={38}
              height={38}
              className="rounded-xl"
            />

            <div>
              <p className="text-base font-semibold tracking-tight">
                Project Pulse
              </p>
              <p className="text-xs font-medium text-[#7b877f]">
                Student Workspace Setup
              </p>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
{/* Intro */}
            <div>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Student Setup
              </span>

              <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-[#203028] md:text-6xl">
                Set up your capstone group.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-[#59645d]">
                Create a group if you are the leader, or join an existing group
                using the code shared by your group leader.
              </p>

              <div className="mt-6 rounded-2xl border border-[#dfe8df] bg-white/70 p-5">
                <p className="text-sm font-semibold text-[#203028]">
                  How this works
                </p>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#59645d]">
                  <li>• Leaders create a group and receive a group code.</li>
                  <li>• Members join using the generated group code.</li>
                  <li>• After setup, students continue to the dashboard.</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
{/* Create group */}
              <Card className="p-6">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#202823] text-sm font-semibold text-white">
                  CG
                </div>

                <h2 className="text-xl font-semibold tracking-tight">
                  Create Group
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#7b877f]">
                  For group leaders starting a capstone workspace.
                </p>

                <div className="mt-6 space-y-3">
                  <input
                    type="text"
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <input
                    type="text"
                    placeholder="Project title"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <textarea
                    placeholder="Members' names or emails"
                    value={members}
                    onChange={(e) => setMembers(e.target.value)}
                    className="min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <p className="text-xs text-[#7b877f]">
                    Members added: {memberCount}
                  </p>

                  {!generatedCode ? (
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      className="w-full rounded-xl bg-[#202823] py-3 text-sm font-semibold text-white transition hover:bg-[#303a33]"
                    >
                      Create Group
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-medium text-emerald-700">
                        Group created successfully
                      </p>

                      <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-800">
                        {generatedCode}
                      </p>

                      <p className="mt-1 text-xs text-emerald-700">
                        Share this code with your members.
                      </p>

                      <button
                        type="button"
                        onClick={handleContinueToDashboard}
                        className="mt-4 w-full rounded-xl bg-[#202823] py-3 text-sm font-semibold text-white transition hover:bg-[#303a33]"
                      >
                        Continue to Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </Card>

{/* Join group */}
              <Card className="p-6">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#94d29a] text-sm font-semibold text-[#203028]">
                  JG
                </div>

                <h2 className="text-xl font-semibold tracking-tight">
                  Join Group
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#7b877f]">
                  Enter the group code provided by your group leader.
                </p>

                <div className="mt-6 space-y-3">
                  <input
                    type="text"
                    placeholder="Group code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm uppercase outline-none transition focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <button
                    type="button"
                    onClick={handleJoinGroup}
                    className="w-full rounded-xl border border-[#dfe8df] py-3 text-sm font-semibold text-[#203028] transition hover:bg-[#f3f7f1]"
                  >
                    Join Group
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
