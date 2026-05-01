"use client";

import { useMemo, useState } from "react";
import StudentShell from "../_components/StudentShell";

type ThreadType = "group" | "adviser" | "staff" | "announcement";

type StudentThread = {
  id: string;
  type: ThreadType;
  label: string;
  description: string;
  meta: string;
};

type Message = {
  id: number;
  threadId: string;
  sender: string;
  role: string;
  text: string;
  time: string;
};

const studentThreads: StudentThread[] = [
  {
    id: "group-chat",
    type: "group",
    label: "Project Pulse Group",
    description: "Private group chat for capstone members",
    meta: "Group",
  },
  {
    id: "adviser",
    type: "adviser",
    label: "Dr. Anna Cruz",
    description: "Assigned adviser for manuscript review",
    meta: "Adviser",
  },
  {
    id: "dean-office",
    type: "staff",
    label: "Dean Office",
    description: "Academic monitoring and final approval office",
    meta: "Dean",
  },
  {
    id: "coordinator",
    type: "staff",
    label: "Capstone Coordinator",
    description: "Schedules, defense notices, and requirements",
    meta: "Coordinator",
  },
  {
    id: "section-announcements",
    type: "announcement",
    label: "BSIT 4A Announcements",
    description: "Section reminders from adviser or coordinator",
    meta: "Announcement",
  },
];

const initialMessages: Message[] = [
  {
    id: 1,
    threadId: "group-chat",
    sender: "Maria Santos",
    role: "Student",
    text: "I uploaded the latest monitoring form draft.",
    time: "8:40 AM",
  },
  {
    id: 2,
    threadId: "group-chat",
    sender: "Student Name",
    role: "Student",
    text: "Thank you. I will check it before we submit.",
    time: "8:45 AM",
  },
  {
    id: 3,
    threadId: "adviser",
    sender: "Dr. Anna Cruz",
    role: "Adviser",
    text: "Please prioritize the unresolved Chapter 2 comments.",
    time: "9:30 AM",
  },
];

export default function StudentChatPage() {
  const [selectedThread, setSelectedThread] = useState<StudentThread>(
    studentThreads[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const filteredThreads = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return studentThreads;

    return studentThreads.filter((thread) =>
      [thread.label, thread.description, thread.meta, thread.type]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery]);

  const groupedThreads = useMemo(() => {
    return {
      main: filteredThreads.filter((thread) => thread.type === "group"),
      academic: filteredThreads.filter(
        (thread) => thread.type === "adviser" || thread.type === "staff",
      ),
      announcements: filteredThreads.filter(
        (thread) => thread.type === "announcement",
      ),
    };
  }, [filteredThreads]);

  const visibleMessages = messages.filter(
    (message) => message.threadId === selectedThread.id,
  );

  function getLatestTime(threadId: string) {
    const latestMessage = [...messages]
      .reverse()
      .find((message) => message.threadId === threadId);

    return latestMessage?.time || "No messages yet";
  }

  function sendMessage() {
    const nextMessage = input.trim();
    if (!nextMessage) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        threadId: selectedThread.id,
        sender: "Student Name",
        role: "Student",
        text: nextMessage,
        time: "Just now",
      },
    ]);

    setInput("");
  }

  return (
    <StudentShell title="Chat">
      <div className="min-h-[760px] overflow-hidden rounded-[28px] border border-[#e7eee7] bg-white shadow-[0_24px_80px_rgba(31,42,36,0.08)]">
        <div className="grid min-h-[760px] lg:grid-cols-[360px_1fr]">
          {/* Threads */}
          <aside className="border-r border-[#edf2ec] bg-white">
            <div className="flex h-[76px] items-center justify-between border-b border-[#edf2ec] px-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
                  Chat
                </h2>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Group and academic communication
                </p>
              </div>
            </div>

            <div className="border-b border-[#edf2ec] px-4 py-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chat..."
                className="w-full rounded-full border border-[#dfe8df] bg-[#f8faf7] px-4 py-2.5 text-sm outline-none placeholder:text-[#a0aaa3] focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </div>

            <div className="h-[calc(760px-136px)] overflow-y-auto px-3 py-3">
              {filteredThreads.length === 0 ? (
                <p className="rounded-2xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  No chats found.
                </p>
              ) : (
                <>
                  <ThreadGroup
                    title="Group"
                    threads={groupedThreads.main}
                    selectedId={selectedThread.id}
                    onSelect={setSelectedThread}
                    getLatestTime={getLatestTime}
                  />

                  <ThreadGroup
                    title="Academic Contacts"
                    threads={groupedThreads.academic}
                    selectedId={selectedThread.id}
                    onSelect={setSelectedThread}
                    getLatestTime={getLatestTime}
                  />

                  <ThreadGroup
                    title="Announcements"
                    threads={groupedThreads.announcements}
                    selectedId={selectedThread.id}
                    onSelect={setSelectedThread}
                    getLatestTime={getLatestTime}
                  />
                </>
              )}
            </div>
          </aside>

          {/* Conversation */}
          <section className="flex min-h-[760px] min-w-0 flex-col bg-[#fbfcfb]">
            <header className="flex h-[76px] items-center justify-between border-b border-[#edf2ec] bg-white px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d7f7d8] text-sm font-semibold text-[#203028]">
                  {selectedThread.label.charAt(0)}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-[#203028]">
                    {selectedThread.label}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[#7b877f]">
                    {selectedThread.description}
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {selectedThread.type === "announcement" && (
                <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-[#dfe8df] bg-white px-5 py-4 text-center">
                  <p className="text-sm font-semibold text-[#203028]">
                    Announcement thread
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7b877f]">
                    This thread is used for official section reminders and
                    academic updates.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {visibleMessages.length === 0 ? (
                  <div className="mx-auto max-w-sm rounded-2xl bg-white px-5 py-4 text-center text-sm text-[#7b877f]">
                    No messages yet. Start the conversation below.
                  </div>
                ) : (
                  visibleMessages.map((message) => {
                    const isStudent = message.role === "Student";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isStudent ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isStudent ? "text-right" : "text-left"
                          }`}
                        >
                          <div
                            className={`rounded-2xl px-5 py-3 text-sm leading-6 ${
                              isStudent
                                ? "bg-white text-[#203028] shadow-[0_8px_24px_rgba(31,42,36,0.05)]"
                                : "bg-[#eef1ef] text-[#203028]"
                            }`}
                          >
                            {message.text}
                          </div>

                          <div
                            className={`mt-1 flex items-center gap-2 text-[11px] text-[#9ba69d] ${
                              isStudent ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>{message.sender}</span>
                            <span>•</span>
                            <span>{message.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Composer */}
            <div className="border-t border-[#edf2ec] bg-white px-5 py-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-[#f8faf7] px-3 py-3">
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg text-[#59645d] hover:bg-[#f3f7f1]"
                >
                  +
                </button>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
                />

                <button
                  type="button"
                  className="rounded-full border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
                >
                  Attach
                </button>

                <button
                  type="button"
                  onClick={sendMessage}
                  className="rounded-full bg-[#202823] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                >
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </StudentShell>
  );
}

function ThreadGroup({
  title,
  threads,
  selectedId,
  onSelect,
  getLatestTime,
}: {
  title: string;
  threads: StudentThread[];
  selectedId: string;
  onSelect: (thread: StudentThread) => void;
  getLatestTime: (threadId: string) => string;
}) {
  if (threads.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ba69d]">
        {title}
      </p>

      <div className="space-y-1">
        {threads.map((thread) => (
          <ThreadButton
            key={thread.id}
            thread={thread}
            selectedId={selectedId}
            latestTime={getLatestTime(thread.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function ThreadButton({
  thread,
  selectedId,
  latestTime,
  onSelect,
}: {
  thread: StudentThread;
  selectedId: string;
  latestTime: string;
  onSelect: (thread: StudentThread) => void;
}) {
  const isSelected = selectedId === thread.id;

  return (
    <button
      type="button"
      onClick={() => onSelect(thread)}
      className={`w-full rounded-2xl px-4 py-3 text-left transition ${
        isSelected ? "bg-[#f2f5f3]" : "hover:bg-[#f8faf7]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isSelected
              ? "bg-[#d7f7d8] text-[#203028]"
              : "bg-[#f3f7f1] text-[#59645d]"
          }`}
        >
          {thread.label.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#203028]">
            {thread.label}
          </p>

          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7b877f]">
            {thread.description}
          </p>

          <p className="mt-1 text-[10px] font-medium text-[#9ba69d]">
            {latestTime}
          </p>
        </div>
      </div>
    </button>
  );
}
