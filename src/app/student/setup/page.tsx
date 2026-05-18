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
    <main className="min-h-screen bg-[#f9f9ff] text-[#171c19]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.65),rgba(207,247,236,0.55)_46%,rgba(249,249,255,0)_82%),radial-gradient(circle_at_50%_28%,rgba(207,247,236,0.34),rgba(249,249,255,0)_58%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3eb_1px,transparent_1px)] opacity-45 [background-size:24px_24px]" />

        <div className="relative z-10 w-full max-w-6xl">
          <div className="mb-12 flex items-center gap-4">
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
                Student Workspace Setup
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-[#16a34a] bg-[#16a34a] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-white">
                Student Setup
              </span>

              <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-[#171c19] md:text-6xl">
                Set up your capstone group.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-[#4d5751]">
                Groups are saved to Firebase and can be assigned advisers and
                panelists by the Admin.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-lg border-[#dfe3eb] bg-white/86 p-6 shadow-[0_20px_55px_rgba(23,28,25,0.08)] backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-[#171c19]">
                  Create Group
                </h2>

                <div className="mt-6 space-y-3">
                  <input
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] px-4 py-3 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
                  />

                  <input
                    placeholder="Project title"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] px-4 py-3 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value as CourseCode)}
                      className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] px-4 py-3 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
                    >
                      {courses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>

                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] px-4 py-3 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
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
                    className="min-h-24 w-full resize-none rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] px-4 py-3 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
                  />

                  <p className="text-xs font-medium text-[#4d5751]">
                    Members added: {memberCount}
                  </p>

                  {!generatedCode ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCreateGroup}
                      className="w-full rounded-lg bg-[#171c19] py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(23,28,25,0.18)] transition hover:bg-[#2a302c] disabled:opacity-60"
                    >
                      {loading ? "Creating..." : "Create Group"}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-[#16a34a] bg-[#16a34a] p-4">
                      <p className="text-xs font-bold text-white">
                        Group created successfully
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-white">
                        {generatedCode}
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push("/student")}
                        className="mt-4 w-full rounded-lg bg-[#171c19] py-3 text-sm font-bold text-white"
                      >
                        Continue to Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="rounded-lg border-[#dfe3eb] bg-white/86 p-6 shadow-[0_20px_55px_rgba(23,28,25,0.08)] backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-[#171c19]">
                  Join Group
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#4d5751]">
                  Enter the group code provided by your leader.
                </p>

                <div className="mt-6 space-y-3">
                  <input
                    placeholder="Group code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-[#dfe3eb] bg-[#f9f9ff] px-4 py-3 text-sm uppercase outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
                  />

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleJoinGroup}
                    className="w-full rounded-lg border border-[#16a34a] bg-[#16a34a] py-3 text-sm font-bold text-white transition hover:border-[#15803d] hover:bg-[#15803d] disabled:opacity-60"
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
