"use client";

import { useMemo, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";

const conversations = [
  {
    id: 1,
    groupName: "Project Pulse",
    course: "BSIT 4A",
    projectTitle: "Smart Capstone Monitoring System",
    lastMessage: "We will upload the missing IDs today.",
    messages: [
      {
        id: 1,
        sender: "Coordinator",
        body: "Please complete the missing final requirements: Government ID, User Manual, Diploma, and TOR.",
        time: "9:15 AM",
      },
      {
        id: 2,
        sender: "Project Pulse",
        body: "Noted. We will upload the missing IDs today.",
        time: "9:24 AM",
      },
    ],
  },
  {
    id: 2,
    groupName: "ArchiveLink",
    course: "BSIS 4A",
    projectTitle: "Digital Records Request and Archive System",
    lastMessage: "All files are ready for archiving.",
    messages: [
      {
        id: 1,
        sender: "Coordinator",
        body: "Your final folder is complete and ready for records archiving.",
        time: "Yesterday",
      },
      {
        id: 2,
        sender: "ArchiveLink",
        body: "Thank you, ma’am.",
        time: "Yesterday",
      },
    ],
  },
];

export default function CoordinatorMessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState(1);
  const [draft, setDraft] = useState("");

  const selectedConversation = useMemo(() => {
    return (
      conversations.find((item) => item.id === selectedConversationId) ||
      conversations[0]
    );
  }, [selectedConversationId]);

  return (
    <CoordinatorShell title="Messages">
      <div className="grid min-h-[720px] overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="border-b border-[#edf2ec] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Student Messages
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Message groups about final requirement collection.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {conversations.map((conversation) => {
              const selected = conversation.id === selectedConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`block w-full px-5 py-4 text-left transition hover:bg-[#fbfdfb] ${
                    selected ? "bg-[#eefaf0]" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-[#203028]">
                    {conversation.groupName}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {conversation.course}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#59645d]">
                    {conversation.lastMessage}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="border-b border-[#edf2ec] px-5 py-4">
            <h3 className="text-lg font-semibold text-[#203028]">
              {selectedConversation.groupName}
            </h3>
            <p className="mt-1 text-sm text-[#59645d]">
              {selectedConversation.course} • {selectedConversation.projectTitle}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8faf7] px-5 py-5">
            {selectedConversation.messages.map((message) => {
              const fromCoordinator = message.sender === "Coordinator";

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    fromCoordinator ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      fromCoordinator
                        ? "bg-[#202823] text-white"
                        : "bg-white text-[#203028]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[11px] font-semibold opacity-70">
                        {message.sender}
                      </p>
                      <p className="text-[10px] opacity-60">{message.time}</p>
                    </div>
                    <p className="mt-1">{message.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#edf2ec] bg-white p-4">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a message about missing requirements..."
                className="min-w-0 flex-1 rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />

              <button
                type="button"
                onClick={() => setDraft("")}
                className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </CoordinatorShell>
  );
}
