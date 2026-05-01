"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";

type ThreadType = "broadcast" | "adviser" | "group" | "staff";
type ThreadMenuAction = "rename" | "pin" | "delete";

type DeanThread = {
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

const THREAD_STORAGE_KEY = "project-pulse-dean-chat-threads";

const deanThreads: DeanThread[] = [
  {
    id: "all-advisers",
    type: "broadcast",
    label: "All Advisers",
    description: "Broadcast announcement to all advisers",
    meta: "Broadcast",
  },
  {
    id: "all-staff",
    type: "broadcast",
    label: "All Academic Staff",
    description: "General announcement for academic staff",
    meta: "Broadcast",
  },
  {
    id: "anna-cruz",
    type: "adviser",
    label: "Anna Cruz",
    description: "Adviser for BSIT and BSCS groups",
    meta: "Adviser",
  },
  {
    id: "project-pulse",
    type: "group",
    label: "Project Pulse Group",
    description: "BSIT 4A • Smart Capstone Monitoring System",
    meta: "Group",
  },
  {
    id: "records-staff",
    type: "staff",
    label: "Records Staff",
    description: "Final validation and archive coordination",
    meta: "Records",
  },
];

const initialMessages: Message[] = [
  {
    id: 1,
    threadId: "all-advisers",
    sender: "Dean Office",
    role: "Dean",
    text: "Please ensure all final approval requirements are updated this week.",
    time: "8:00 AM",
  },
  {
    id: 2,
    threadId: "anna-cruz",
    sender: "Anna Cruz",
    role: "Adviser",
    text: "Good morning, Dean. Project Pulse is still completing its final revisions.",
    time: "9:12 AM",
  },
  {
    id: 3,
    threadId: "anna-cruz",
    sender: "Dean Office",
    role: "Dean",
    text: "Noted. Please update the readiness status once the adviser review is complete.",
    time: "9:20 AM",
  },
];

export default function DeanMessagesPage() {
  const [threads, setThreads] = useState<DeanThread[]>(deanThreads);
  const [selectedThread, setSelectedThread] = useState<DeanThread>(deanThreads[0]);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    const savedThreads = localStorage.getItem(THREAD_STORAGE_KEY);
    if (!savedThreads) return;

    const parsedThreads = JSON.parse(savedThreads) as DeanThread[];

    if (!Array.isArray(parsedThreads) || parsedThreads.length === 0) return;

    setThreads(parsedThreads);
    setSelectedThread(parsedThreads[0]);
  }, []);

  const filteredThreads = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return threads;

    return threads.filter((thread) =>
      [thread.label, thread.description, thread.meta, thread.type]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, threads]);

  const groupedThreads = useMemo(() => {
    return {
      broadcast: filteredThreads.filter((thread) => thread.type === "broadcast"),
      advisers: filteredThreads.filter((thread) => thread.type === "adviser"),
      groups: filteredThreads.filter((thread) => thread.type === "group"),
      staff: filteredThreads.filter((thread) => thread.type === "staff"),
    };
  }, [filteredThreads]);

  const visibleMessages = messages.filter(
    (message) => message.threadId === selectedThread.id,
  );

  function saveThreads(nextThreads: DeanThread[]) {
    setThreads(nextThreads);
    localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(nextThreads));
  }

  function getLatestTime(threadId: string) {
    const latestMessage = [...messages]
      .reverse()
      .find((message) => message.threadId === threadId);

    return latestMessage?.time || "No messages yet";
  }

  function handleThreadAction(thread: DeanThread, action: ThreadMenuAction) {
    setOpenMenuId(null);

    if (action === "rename") {
      const nextLabel = window.prompt("Rename conversation", thread.label);
      if (!nextLabel?.trim()) return;

      const renamedThread = {
        ...thread,
        label: nextLabel.trim(),
      };

      const nextThreads = threads.map((item) =>
        item.id === thread.id ? renamedThread : item,
      );

      saveThreads(nextThreads);

      if (selectedThread.id === thread.id) {
        setSelectedThread(renamedThread);
      }

      return;
    }

    if (action === "pin") {
      const nextThreads = [
        thread,
        ...threads.filter((item) => item.id !== thread.id),
      ];

      saveThreads(nextThreads);
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(
        `Delete "${thread.label}" from the message list?`,
      );

      if (!confirmed) return;

      const nextThreads = threads.filter((item) => item.id !== thread.id);

      saveThreads(nextThreads);

      if (selectedThread.id === thread.id && nextThreads.length > 0) {
        setSelectedThread(nextThreads[0]);
      }
    }
  }

  function sendMessage() {
    const nextMessage = input.trim();
    if (!nextMessage) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        threadId: selectedThread.id,
        sender: "Dean Office",
        role: "Dean",
        text: nextMessage,
        time: "Just now",
      },
    ]);

    setInput("");
  }

  return (
    <DeanShell title="Messages">
      <div className="min-h-[760px] overflow-hidden rounded-[28px] border border-[#e7eee7] bg-white shadow-[0_24px_80px_rgba(31,42,36,0.08)]">
        <div className="grid min-h-[760px] lg:grid-cols-[360px_1fr]">
          {/* Threads */}
          <aside className="border-r border-[#edf2ec] bg-white">
            <div className="flex h-[76px] items-center justify-between border-b border-[#edf2ec] px-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
                  Messages
                </h2>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Executive communication center
                </p>
              </div>
            </div>

            <div className="border-b border-[#edf2ec] px-4 py-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search adviser, group, or staff..."
                className="w-full rounded-full border border-[#dfe8df] bg-[#f8faf7] px-4 py-2.5 text-sm outline-none placeholder:text-[#a0aaa3] focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </div>

            <div className="h-[calc(760px-136px)] overflow-y-auto px-3 py-3">
              {filteredThreads.length === 0 ? (
                <p className="rounded-2xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  No conversations found.
                </p>
              ) : (
                <>
                  <ThreadGroup
                    title="Broadcast"
                    threads={groupedThreads.broadcast}
                    selectedId={selectedThread.id}
                    openMenuId={openMenuId}
                    onMenuToggle={setOpenMenuId}
                    onSelect={setSelectedThread}
                    onAction={handleThreadAction}
                    getLatestTime={getLatestTime}
                  />

                  <ThreadGroup
                    title="Advisers"
                    threads={groupedThreads.advisers}
                    selectedId={selectedThread.id}
                    openMenuId={openMenuId}
                    onMenuToggle={setOpenMenuId}
                    onSelect={setSelectedThread}
                    onAction={handleThreadAction}
                    getLatestTime={getLatestTime}
                  />

                  <ThreadGroup
                    title="Groups"
                    threads={groupedThreads.groups}
                    selectedId={selectedThread.id}
                    openMenuId={openMenuId}
                    onMenuToggle={setOpenMenuId}
                    onSelect={setSelectedThread}
                    onAction={handleThreadAction}
                    getLatestTime={getLatestTime}
                  />

                  <ThreadGroup
                    title="Staff"
                    threads={groupedThreads.staff}
                    selectedId={selectedThread.id}
                    openMenuId={openMenuId}
                    onMenuToggle={setOpenMenuId}
                    onSelect={setSelectedThread}
                    onAction={handleThreadAction}
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
                  {selectedThread.type === "broadcast"
                    ? "All"
                    : selectedThread.label.charAt(0)}
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
              {selectedThread.type === "broadcast" && (
                <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-[#dfe8df] bg-white px-5 py-4 text-center">
                  <p className="text-sm font-semibold text-[#203028]">
                    Broadcast mode
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7b877f]">
                    Messages here are sent to the selected executive audience.
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
                    const isDean = message.role === "Dean";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isDean ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isDean ? "text-right" : "text-left"
                          }`}
                        >
                          <div
                            className={`rounded-2xl px-5 py-3 text-sm leading-6 ${
                              isDean
                                ? "bg-white text-[#203028] shadow-[0_8px_24px_rgba(31,42,36,0.05)]"
                                : "bg-[#eef1ef] text-[#203028]"
                            }`}
                          >
                            {message.text}
                          </div>

                          <div
                            className={`mt-1 flex items-center gap-2 text-[11px] text-[#9ba69d] ${
                              isDean ? "justify-end" : "justify-start"
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
    </DeanShell>
  );
}

function ThreadGroup({
  title,
  threads,
  selectedId,
  openMenuId,
  onMenuToggle,
  onSelect,
  onAction,
  getLatestTime,
}: {
  title: string;
  threads: DeanThread[];
  selectedId: string;
  openMenuId: string | null;
  onMenuToggle: (id: string | null) => void;
  onSelect: (thread: DeanThread) => void;
  onAction: (thread: DeanThread, action: ThreadMenuAction) => void;
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
            openMenuId={openMenuId}
            latestTime={getLatestTime(thread.id)}
            onMenuToggle={onMenuToggle}
            onSelect={onSelect}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

function ThreadButton({
  thread,
  selectedId,
  openMenuId,
  latestTime,
  onMenuToggle,
  onSelect,
  onAction,
}: {
  thread: DeanThread;
  selectedId: string;
  openMenuId: string | null;
  latestTime: string;
  onMenuToggle: (id: string | null) => void;
  onSelect: (thread: DeanThread) => void;
  onAction: (thread: DeanThread, action: ThreadMenuAction) => void;
}) {
  const isSelected = selectedId === thread.id;
  const isMenuOpen = openMenuId === thread.id;

  return (
    <div className="relative">
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
            {thread.type === "broadcast" ? "All" : thread.label.charAt(0)}
          </div>

          <div className="min-w-0 flex-1 pr-8">
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

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle(isMenuOpen ? null : thread.id);
        }}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-[#9ba69d] hover:bg-white hover:text-[#203028]"
      >
        ⋯
      </button>

      {isMenuOpen && (
        <div className="absolute right-3 top-11 z-20 w-36 overflow-hidden rounded-xl border border-[#dfe8df] bg-white shadow-[0_16px_40px_rgba(31,42,36,0.12)]">
          <button
            type="button"
            onClick={() => onAction(thread, "rename")}
            className="block w-full px-4 py-2.5 text-left text-xs font-medium text-[#203028] hover:bg-[#f8faf7]"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => onAction(thread, "pin")}
            className="block w-full px-4 py-2.5 text-left text-xs font-medium text-[#203028] hover:bg-[#f8faf7]"
          >
            Pin
          </button>
          <button
            type="button"
            onClick={() => onAction(thread, "delete")}
            className="block w-full px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
