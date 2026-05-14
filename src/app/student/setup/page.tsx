"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import Card from "../_components/Card";
import { db, type CapstoneGroup, type CourseCode } from "../../_lib/firebase";
import {
  getStoredUserEmail,
  getStoredUserUid,
} from "../../_utils/authStorage";
import { saveStoredStudentGroup } from "../_utils/studentGroupStorage";

const courses: CourseCode[] = ["BSIT", "BSCS", "BSIS"];
const sections = ["4A", "4B", "4C"];

function generateGroupCode() {
  return `PP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function parseMembers(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((email) => ({
      email,
      name: email.split("@")[0],
      role: "Member" as const,
    }));
}

export default function StudentSetupPage() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [course, setCourse] = useState<CourseCode>("BSIT");
  const [section, setSection] = useState("4A");
  const [members, setMembers] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const memberCount = useMemo(() => parseMembers(members).length, [members]);

  async function handleCreateGroup() {
    setError("");

    const uid = getStoredUserUid();
    const email = getStoredUserEmail();

    if (!uid || !email) {
      setError("Please log in again before creating a group.");
      return;
    }

    setLoading(true);

    try {
      const code = generateGroupCode();
      const now = new Date().toISOString();

      const groupPayload: Omit<CapstoneGroup, "id"> = {
        groupName: groupName || "Untitled Group",
        projectTitle: projectTitle || "Untitled Project",
        groupCode: code,
        course,
        section,
        members: [
          {
            uid,
            email,
            name: email.split("@")[0],
            role: "Group Leader",
          },
          ...parseMembers(members),
        ],
        leaderId: uid,
        adviserId: "",
        adviserName: "Unassigned",
        panelists: [],
        stage: "Proposal Defense",
        progress: 0,
        status: "Active",
        createdAt: now,
        updatedAt: now,
      };

      const groupRef = await addDoc(collection(db, "groups"), groupPayload);

      const savedGroup: CapstoneGroup = {
        id: groupRef.id,
        ...groupPayload,
      };

      saveStoredStudentGroup(savedGroup);
      setGeneratedCode(code);
    } catch {
      setError("Something went wrong while creating the group.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinGroup() {
    setError("");

    const uid = getStoredUserUid();
    const email = getStoredUserEmail();
    const normalizedCode = joinCode.trim().toUpperCase();

    if (!uid || !email) {
      setError("Please log in again before joining a group.");
      return;
    }

    if (!normalizedCode) {
      setError("Group code is required.");
      return;
    }

    setLoading(true);

    try {
      const groupQuery = query(
        collection(db, "groups"),
        where("groupCode", "==", normalizedCode),
        limit(1),
      );

      const snapshot = await getDocs(groupQuery);

      if (snapshot.empty) {
        setError("No group found with that code.");
        return;
      }

      const groupDoc = snapshot.docs[0];
      const groupData = groupDoc.data() as Omit<CapstoneGroup, "id">;

      const member = {
        uid,
        email,
        name: email.split("@")[0],
        role: "Member" as const,
      };

      const existingMembers = groupData.members || [];
      const isAlreadyMember = existingMembers.some(
        (item) => item.email.toLowerCase() === email.toLowerCase(),
      );

      const nextMembers = isAlreadyMember
        ? existingMembers
        : [...existingMembers, member];

      if (!isAlreadyMember) {
        await updateDoc(groupDoc.ref, {
          members: nextMembers,
          updatedAt: new Date().toISOString(),
        });
      }

      saveStoredStudentGroup({
        id: groupDoc.id,
        ...groupData,
        members: nextMembers,
      });

      router.push("/student");
    } catch {
      setError("Something went wrong while joining the group.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(255,255,255,0)_82%)]" />

        <div className="relative z-10 w-full max-w-6xl">
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

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Student Setup
              </span>

              <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-[#203028] md:text-6xl">
                Set up your capstone group.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-[#59645d]">
                Groups are saved to Firebase and can be assigned advisers and
                panelists by the Admin.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold tracking-tight">
                  Create Group
                </h2>

                <div className="mt-6 space-y-3">
                  <input
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <input
                    placeholder="Project title"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value as CourseCode)}
                      className="rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none"
                    >
                      {courses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>

                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none"
                    >
                      {sections.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    placeholder="Members' UB emails, separated by comma or new line"
                    value={members}
                    onChange={(e) => setMembers(e.target.value)}
                    className="min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <p className="text-xs text-[#7b877f]">
                    Members added: {memberCount}
                  </p>

                  {!generatedCode ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCreateGroup}
                      className="w-full rounded-xl bg-[#202823] py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {loading ? "Creating..." : "Create Group"}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-medium text-emerald-700">
                        Group created successfully
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-800">
                        {generatedCode}
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push("/student")}
                        className="mt-4 w-full rounded-xl bg-[#202823] py-3 text-sm font-semibold text-white"
                      >
                        Continue to Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold tracking-tight">
                  Join Group
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#7b877f]">
                  Enter the group code provided by your leader.
                </p>

                <div className="mt-6 space-y-3">
                  <input
                    placeholder="Group code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-[#dfe8df] px-4 py-3 text-sm uppercase outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleJoinGroup}
                    className="w-full rounded-xl border border-[#dfe8df] py-3 text-sm font-semibold text-[#203028] disabled:opacity-60"
                  >
                    {loading ? "Joining..." : "Join Group"}
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
