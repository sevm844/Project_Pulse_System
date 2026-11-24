"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import StudentShell from "../../_components/StudentShell";
import RoleMessagesPage from "../../../_components/RoleMessagesPage";
import FormsShelf from "../../../_components/requirements/FormsShelf";
import StudentAssignments from "../../../_components/requirements/StudentAssignments";
import { fetchClass, subjectLabel, type ApiClass } from "../../../_lib/classes";
import { errorMessage } from "../../../_lib/groups";
import type { ApiConversation } from "../../../_lib/messages";

type Tab = "assignments" | "forms" | "chat" | "more";
type Tile = { title: string; text: string; href: string };

// The chats of a subject (defined here, outside the component, so the list is not reloaded on every draw): AppDev = the group chat and the adviser,
// CAP101-2 = the Dean and the Dean's Secretary.
const appdevChats = (conversation: ApiConversation) => conversation.type === "Group" || conversation.subtitle === "Adviser";
const capChats = (conversation: ApiConversation) => conversation.subtitle === "Dean" || conversation.subtitle === "Dean's Secretary";
const keep = (children: ReactNode) => <>{children}</>;

// The other things a subject holds, which keep their own pages.
const MORE: Record<string, Tile[]> = {
  APPDEV: [
    { title: "My group and project", text: "Your group, your title and where you stand.", href: "/student/project" },
    { title: "Proposal Defense", text: "The date, the room and the panel of your Proposal Defense.", href: "/student/defense" },
  ],
  "CAP101-2": [
    { title: "Manuscript", text: "Write your manuscript with your group. The Dean reads it from the Alpha stage.", href: "/student/manuscript" },
    { title: "Documents", text: "Every file you handed in, in one place.", href: "/student/documents" },
    { title: "Defenses", text: "Your Alpha, Beta, Omega and Final defense schedule.", href: "/student/defense" },
  ],
};

const TAB_LABELS: Record<Tab, string> = { assignments: "Classwork", forms: "Forms", chat: "Chat", more: "More" };

export default function StudentSubjectPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [item, setItem] = useState<ApiClass | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("assignments");

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) return;
    let cancelled = false;

    fetchClass(id)
      .then((loaded) => {
        if (!cancelled) setItem(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "This subject was not found."));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const subject = item?.subject_code === "APPDEV" ? "appdev" : "cap";
  const teacherLabel = item?.subject_code === "APPDEV" ? "your adviser" : "the Dean";

  return (
    <StudentShell title="Subject">
      <div className="space-y-5">
        <Link href="/student" className="inline-block text-xs font-semibold text-[#4f8f58] hover:underline">
          ← All my subjects
        </Link>

        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}

        {item && (
          <>
            <div
              className="rounded-2xl bg-[#123f2b] bg-cover bg-center px-6 py-6 text-white"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(18,63,43,0.92), rgba(18,63,43,0.55)), url(${item.subject_code === "APPDEV" ? "/subjects/appdev.webp" : "/subjects/capstone.jpg"})`,
              }}
            >
              <p className="text-3xl font-extrabold tracking-tight">{subjectLabel(item.subject_code)}</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{item.subject_name}</p>
              <p className="mt-3 text-sm text-white/85">
                {item.name} · {item.teacher}
              </p>
              <p className="mt-0.5 text-xs text-white/70">
                {item.school_year} · {item.semester}
                {item.group_name ? ` · Group: ${item.group_name}` : ""}
              </p>
            </div>

            <div className="flex gap-6 border-b border-[#edf2ec] text-sm" role="tablist">
              {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 pb-3 transition ${tab === key ? "border-[#123f2b] font-semibold text-[#203028]" : "border-transparent text-[#7b877f] hover:text-[#203028]"}`}
                >
                  {TAB_LABELS[key]}
                </button>
              ))}
            </div>

            {tab === "assignments" && <StudentAssignments subject={subject} embedded />}
            {tab === "forms" && (
              <div className="[&>div]:max-w-none">
                <FormsShelf role="Student" from={subject === "appdev" ? "Adviser" : "Dean"} />
              </div>
            )}
            {tab === "chat" && (
              <div>
                <p className="mb-3 text-sm text-[#7b877f]">Messages with {teacherLabel}{item.subject_code === "APPDEV" ? " and your group" : ""}.</p>
                <RoleMessagesPage subtitle={`${subjectLabel(item.subject_code)} chat`} only={item.subject_code === "APPDEV" ? appdevChats : capChats} shell={keep} />
              </div>
            )}
            {tab === "more" && (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(MORE[item.subject_code] ?? []).map((tile) => (
                  <li key={tile.title}>
                    <Link
                      href={tile.href}
                      className="block h-full rounded-xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)] transition hover:-translate-y-0.5 hover:border-[#123f2b]"
                    >
                      <p className="text-sm font-semibold text-[#203028]">{tile.title}</p>
                      <p className="mt-1.5 text-xs leading-5 text-[#7b877f]">{tile.text}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </StudentShell>
  );
}
