"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  addChatMessage,
  getChatThreadsForRole,
  getStoredChatMessages,
  saveChatThreadsForRole,
  unsendChatMessage,
  type ChatRole,
  type StoredChatMessage,
  type StoredChatThread,
} from "../_utils/chatStorage";
import {
  formatScheduleWindow,
  getStoredMessagingSchedule,
  isMessagingAllowedNow,
  MESSAGING_SCHEDULE_UPDATED_EVENT,
  type MessagingSchedule,
} from "../_utils/messagingScheduleStorage";

type RoleMessagesPageProps = {
  role: ChatRole;
  senderName: string;
  title?: string;
  subtitle?: string;
  fitViewport?: boolean;
  shell: (children: ReactNode) => ReactNode;
};

type ThreadMenuAction = "rename" | "pin" | "delete";

export default function RoleMessagesPage({
  role,
  senderName,
  subtitle = "Communication center",
  fitViewport = false,
  shell,
}: RoleMessagesPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [threads, setThreads] = useState<StoredChatThread[]>(() =>
    getChatThreadsForRole(role),
  );
  const [selectedThread, setSelectedThread] = useState<StoredChatThread>(
    () => getChatThreadsForRole(role)[0],
  );
  const [messages, setMessages] = useState<StoredChatMessage[]>(() =>
    getStoredChatMessages(),
  );

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [schedule, setSchedule] = useState<MessagingSchedule>(() =>
    getStoredMessagingSchedule(),
  );
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const scheduleApplies = role === "Student";
  const canSendNow =
    !scheduleApplies || isMessagingAllowedNow(schedule, currentTime);
  const scheduleWindow = formatScheduleWindow(schedule);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30000);

    function syncSchedule() {
      setSchedule(getStoredMessagingSchedule());
      setCurrentTime(new Date());
    }

    window.addEventListener(MESSAGING_SCHEDULE_UPDATED_EVENT, syncSchedule);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(MESSAGING_SCHEDULE_UPDATED_EVENT, syncSchedule);
    };
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

  const visibleMessages = messages.filter(
    (message) => message.threadId === selectedThread.id,
  );

  function refreshMessages() {
    setMessages(getStoredChatMessages());
  }

  function getLatestTime(threadId: string) {
    const latestMessage = [...messages]
      .reverse()
      .find((message) => message.threadId === threadId);

    return latestMessage?.time || "No messages yet";
  }

  function saveThreads(nextThreads: StoredChatThread[]) {
    setThreads(nextThreads);
    saveChatThreadsForRole(role, nextThreads);
  }

  function handleThreadAction(
    thread: StoredChatThread,
    action: ThreadMenuAction,
  ) {
    setOpenMenuId(null);

    if (action === "rename") {
      const nextLabel = window.prompt("Rename conversation", thread.label);
      if (!nextLabel?.trim()) return;

      const renamedThread = { ...thread, label: nextLabel.trim() };
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
      saveThreads([thread, ...threads.filter((item) => item.id !== thread.id)]);
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

    if (!canSendNow) return;
    if (!nextMessage && !selectedFileName) return;

    addChatMessage({
      thread: selectedThread,
      sender: senderName,
      role,
      text: nextMessage || "Shared a file.",
      attachmentName: selectedFileName || undefined,
    });

    setInput("");
    setSelectedFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    refreshMessages();
  }

  function handleUnsend(messageId: number) {
    unsendChatMessage(messageId, role);
    setOpenMessageMenuId(null);
    refreshMessages();
  }

  return shell(
    <div className={`${fitViewport ? "h-full min-h-0" : "min-h-[760px]"} overflow-hidden rounded-[28px] border border-[#e7eee7] bg-white shadow-[0_24px_80px_rgba(31,42,36,0.08)]`}>
      <div className={`grid ${fitViewport ? "h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-1" : "min-h-[760px]"} lg:grid-cols-[360px_1fr]`}>
        <aside className={`${fitViewport ? "flex min-h-0 flex-col overflow-hidden" : ""} border-r border-[#edf2ec] bg-white`}>
          <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#edf2ec] px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#203028]">
                Messages
              </h2>
              <p className="mt-1 text-xs text-[#7b877f]">{subtitle}</p>
            </div>
          </div>

          <div className="shrink-0 border-b border-[#edf2ec] px-4 py-3">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-full border border-[#dfe8df] bg-[#f8faf7] px-4 py-2.5 text-sm outline-none placeholder:text-[#a0aaa3] focus:ring-2 focus:ring-[#d7f7d8]"
            />
          </div>

          <div className={`${fitViewport ? "min-h-0 flex-1 overscroll-contain" : "h-[calc(760px-136px)]"} overflow-y-auto px-3 py-3`}>
            {filteredThreads.map((thread) => (
              <ThreadButton
                key={thread.id}
                thread={thread}
                selectedId={selectedThread.id}
                openMenuId={openMenuId}
                latestTime={getLatestTime(thread.id)}
                onMenuToggle={setOpenMenuId}
                onSelect={(nextThread) => {
                  setSelectedThread(nextThread);
                  setOpenMessageMenuId(null);
                }}
                onAction={handleThreadAction}
              />
            ))}
          </div>
        </aside>

        <section className={`flex ${fitViewport ? "min-h-0 overflow-hidden" : "min-h-[760px]"} min-w-0 flex-col bg-[#fbfcfb]`}>
          <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#edf2ec] bg-white px-6">
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

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6"
            onClick={() => setOpenMessageMenuId(null)}
          >
            <div className="space-y-5">
              {visibleMessages.length === 0 ? (
                <div className="mx-auto max-w-sm rounded-2xl bg-white px-5 py-4 text-center text-sm text-[#7b877f]">
                  No messages yet. Start the conversation below.
                </div>
              ) : (
                visibleMessages.map((message) => {
                  const isMine = message.role === role;
                  const isMenuOpen = openMessageMenuId === message.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="max-w-[72%]">
                        <div
                          className={`flex items-start gap-2 ${
                            isMine ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`min-w-[180px] max-w-full rounded-2xl px-5 py-3 text-sm leading-6 ${
                              message.unsent
                                ? "border border-dashed border-[#dfe8df] bg-white text-[#9ba69d]"
                                : isMine
                                  ? "bg-[#eef5ff] text-[#203028] shadow-[0_8px_24px_rgba(31,42,36,0.05)]"
                                  : "bg-[#eef1ef] text-[#203028]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-left">
                              {message.text}
                            </p>

                            {!message.unsent && message.attachmentName && (
                              <div className="mt-3 rounded-xl border border-[#dfe8df] bg-white/70 px-3 py-2 text-xs font-semibold text-[#4f8f58]">
                                Attached file: {message.attachmentName}
                              </div>
                            )}
                          </div>

                          {isMine && !message.unsent && (
                            <div
                              className="relative mt-1"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMessageMenuId(
                                    isMenuOpen ? null : message.id,
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-[#7b877f] transition hover:bg-white hover:text-[#203028]"
                                aria-label="Message options"
                              >
                                ⋯
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-10 z-30 w-40 overflow-hidden rounded-xl border border-[#dfe8df] bg-white text-left shadow-[0_16px_40px_rgba(31,42,36,0.14)]">
                                  <button
                                    type="button"
                                    onClick={() => handleUnsend(message.id)}
                                    className="block w-full px-4 py-3 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                  >
                                    Unsend message
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          className={`mt-1 flex items-center gap-2 text-[11px] text-[#9ba69d] ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{message.sender}</span>
                          <span>•</span>
                          <span>{message.time}</span>
                          {isMine && !message.unsent && (
                            <span className="font-semibold text-blue-500">
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#edf2ec] bg-white px-5 py-4">
            {scheduleApplies && (
              <div
                className={`mb-3 rounded-xl border px-4 py-3 text-xs font-semibold ${
                  canSendNow
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {canSendNow
                  ? `Messaging is open until ${schedule.endTime}.`
                  : `Messaging is closed. Admin availability window: ${scheduleWindow}.`}
              </div>
            )}

            {selectedFileName && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-[#dfe8df] bg-[#f8faf7] px-4 py-2 text-xs">
                <span className="min-w-0 truncate font-semibold text-[#4f8f58]">
                  Selected file: {selectedFileName}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFileName("")}
                  className="ml-3 font-semibold text-rose-600"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-[#f8faf7] px-3 py-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) =>
                  setSelectedFileName(event.target.files?.[0]?.name || "")
                }
              />

              <button
                type="button"
                onClick={() => canSendNow && fileInputRef.current?.click()}
                disabled={!canSendNow}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg text-[#59645d] hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-45"
              >
                +
              </button>

              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                disabled={!canSendNow}
                placeholder={
                  canSendNow
                    ? "Write a message..."
                    : "Messaging is currently closed"
                }
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a0aaa3] disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => canSendNow && fileInputRef.current?.click()}
                disabled={!canSendNow}
                className="rounded-full border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Attach
              </button>

              <button
                type="button"
                onClick={sendMessage}
                disabled={!canSendNow}
                className="rounded-full bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:cursor-not-allowed disabled:bg-[#aab3ad]"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>,
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
  thread: StoredChatThread;
  selectedId: string;
  openMenuId: string | null;
  latestTime: string;
  onMenuToggle: (id: string | null) => void;
  onSelect: (thread: StoredChatThread) => void;
  onAction: (thread: StoredChatThread, action: ThreadMenuAction) => void;
}) {
  const isSelected = selectedId === thread.id;
  const isMenuOpen = openMenuId === thread.id;

  return (
    <div className="relative mb-1">
      <button
        type="button"
        onClick={() => onSelect(thread)}
        className={`w-full rounded-2xl px-4 py-3 text-left transition ${
          isSelected ? "bg-[#f2f5f3]" : "hover:bg-[#f8faf7]"
        }`}
      >
        <p className="truncate text-sm font-semibold text-[#203028]">
          {thread.label}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7b877f]">
          {thread.description}
        </p>
        <p className="mt-1 text-[10px] font-medium text-[#9ba69d]">
          {latestTime}
        </p>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
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
