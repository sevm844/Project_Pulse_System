"use client";

import { useState } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";

type ChatMessage = {
  id: number;
  sender: string;
  role: string;
  message: string;
  time: string;
  linkedFeedback?: string;
};

export default function ChatPage() {
  const [chatTarget, setChatTarget] = useState("Adviser");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "Dr. Rivera",
      role: "Adviser",
      message: "Please prioritize the unresolved Chapter 2 comments.",
      time: "9:30 AM",
      linkedFeedback: "Chapter 2 feedback",
    },
    {
      id: 2,
      sender: "Student Name",
      role: "Student",
      message: "Noted, Ma'am. We will upload the revised version today.",
      time: "9:42 AM",
    },
  ]);

  function sendMessage() {
    if (!chatInput.trim()) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender: "Student Name",
        role: "Student",
        message: chatInput,
        time: "Just now",
      },
    ]);

    setChatInput("");
  }

  return (
    <StudentShell title="Chat">
      <div className="grid min-h-[680px] gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] p-5">
            <h2 className="text-lg font-semibold text-[#203028]">Chat</h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Message adviser, dean, and students.
            </p>
          </div>

          <div className="space-y-1 p-3">
            {["Adviser", "Dean", "Group Chat", "Maria Santos", "John Reyes"].map(
              (target) => (
                <button
                  key={target}
                  onClick={() => setChatTarget(target)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    chatTarget === target
                      ? "bg-[#d7f7d8] text-[#203028]"
                      : "text-[#59645d] hover:bg-[#f3f7f1]"
                  }`}
                >
                  {target}
                </button>
              ),
            )}
          </div>
        </Card>

        <Card className="flex min-h-[680px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#edf2ec] p-5">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                {chatTarget}
              </h2>
              <p className="text-xs text-[#7b877f]">
                File sharing, feedback links, and task creation are supported.
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Online
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdfb] p-5">
            <div className="rounded-xl border border-[#dfe8df] bg-white p-4 text-sm text-[#59645d]">
              <p className="font-semibold text-[#203028]">
                Pinned announcement
              </p>
              <p className="mt-1">
                Please complete all Alpha Defense requirements before May 08.
              </p>
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[78%] rounded-2xl p-4 ${
                  message.role === "Student"
                    ? "ml-auto bg-[#202823] text-white"
                    : "bg-white text-[#203028]"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold">{message.sender}</p>
                  <p
                    className={`text-[10px] ${
                      message.role === "Student"
                        ? "text-white/60"
                        : "text-[#7b877f]"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
                <p className="text-sm leading-6">{message.message}</p>
                {message.linkedFeedback && (
                  <a
                    href="/student/feedback"
                    className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold"
                  >
                    Open linked feedback
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#edf2ec] p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 rounded-lg border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
              <button className="rounded-lg border border-[#dfe8df] px-4 py-3 text-xs font-semibold hover:bg-[#f3f7f1]">
                Attach File
              </button>
              <button
                onClick={sendMessage}
                className="rounded-lg bg-[#202823] px-5 py-3 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Send
              </button>
            </div>
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
