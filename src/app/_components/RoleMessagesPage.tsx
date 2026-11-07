"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clockLabel,
  fetchContacts,
  fetchConversations,
  fetchMessages,
  messageTime,
  openDirectChat,
  sendMessage,
  unsendMessage,
  type ApiContact,
  type ApiConversation,
  type ApiMessage,
  type MessagingWindowInfo,
} from "../_lib/messages";
import { announceNotificationsChanged } from "../_lib/notifications";

type Props = {
  subtitle?: string;
  fitViewport?: boolean;
  shell: (children: ReactNode) => ReactNode;
};

const LIST_REFRESH_MS = 10000;
const THREAD_REFRESH_MS = 5000;

export default function RoleMessagesPage({
  subtitle = "Communication center",
  fitViewport = false,
  shell,
}: Props) {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [windowInfo, setWindowInfo] = useState<MessagingWindowInfo | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [contacts, setContacts] = useState<ApiContact[] | null>(null);
  const [contactSearch, setContactSearch] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastSeenId = useRef(0);

  const selected = conversations.find((c) => c.conversation_id === selectedId) ?? null;
  const canSend = !windowInfo || windowInfo.open;

  // Promise chains (not async/await) keep every setState in a callback, never straight in an effect body.
  const refreshList = useCallback(
    () =>
      fetchConversations()
        .then((list) => {
          setConversations(list.items);
          setWindowInfo(list.window);
          setError("");
          setSelectedId((current) => {
            if (current && list.items.some((c) => c.conversation_id === current)) return current;
            return list.items[0]?.conversation_id ?? null;
          });
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Could not load your messages."))
        .finally(() => setLoading(false)),
    [],
  );

  const refreshThread = useCallback(
    (conversationId: number) =>
      fetchMessages(conversationId)
        .then(({ messages: next }) => {
          setMessages((current) => {
            const same =
              current.length === next.length &&
              current.every((m, i) => m.message_id === next[i].message_id && m.unsent === next[i].unsent);
            return same ? current : next;
          });
          // Reading marks the conversation as read, so the bell and the unread dots change too.
          announceNotificationsChanged();
        })
        // A failed refresh keeps what is on screen; the next tick tries again.
        .catch(() => undefined),
    [],
  );

  useEffect(() => {
    void refreshList();
    const timer = window.setInterval(() => void refreshList(), LIST_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [refreshList]);

  useEffect(() => {
    if (selectedId === null) return;

    void refreshThread(selectedId);
    const timer = window.setInterval(() => void refreshThread(selectedId), THREAD_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [selectedId, refreshThread]);

  // Scroll down only when a newer message arrived, not on every refresh.
  useEffect(() => {
    const newest = messages[messages.length - 1]?.message_id ?? 0;

    if (newest !== lastSeenId.current) {
      lastSeenId.current = newest;
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return query
      ? conversations.filter((c) => `${c.title} ${c.subtitle}`.toLowerCase().includes(query))
      : conversations;
  }, [conversations, search]);

  const filteredContacts = useMemo(() => {
    const query = contactSearch.toLowerCase().trim();

    return (contacts ?? []).filter(
      (c) => !query || `${c.name} ${c.role}`.toLowerCase().includes(query),
    );
  }, [contacts, contactSearch]);

  function select(id: number) {
    if (id === selectedId) return;

    setSelectedId(id);
    setMessages([]);
    lastSeenId.current = 0;
    setSendError("");
    setOpenMenuId(null);
  }

  async function startPicking() {
    setPicking(true);
    setContactSearch("");

    if (contacts === null) {
      try {
        setContacts(await fetchContacts());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load contacts.");
        setPicking(false);
      }
    }
  }

  async function startChat(userId: number) {
    try {
      const { conversation_id } = await openDirectChat(userId);
      setPicking(false);
      await refreshList();
      select(conversation_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the chat.");
    }
  }

  async function handleSend() {
    const content = input.trim();

    if (!content || selectedId === null || sending || !canSend) return;

    setSending(true);
    setSendError("");

    try {
      await sendMessage(selectedId, content);
      setInput("");
      await Promise.all([refreshThread(selectedId), refreshList()]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send the message.");
      // The window may have just closed; pick up the new state.
      void refreshList();
    } finally {
      setSending(false);
    }
  }

  async function handleUnsend(messageId: number) {
    setOpenMenuId(null);

    try {
      await unsendMessage(messageId);
      if (selectedId !== null) await Promise.all([refreshThread(selectedId), refreshList()]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not unsend the message.");
    }
  }

  return shell(
    <div
      className={`${fitViewport ? "h-full min-h-0" : "min-h-[760px]"} overflow-hidden rounded-[28px] border border-[#e7eee7] bg-white shadow-[0_24px_80px_rgba(31,42,36,0.08)]`}
    >
      <div
        className={`grid ${fitViewport ? "h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-1" : "min-h-[760px]"} lg:grid-cols-[360px_1fr]`}
      >
        <aside
          className={`${fitViewport ? "flex min-h-0 flex-col overflow-hidden" : ""} border-r border-[#edf2ec] bg-white`}
        >
          <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#edf2ec] px-6">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-[#203028]">Messages</h2>
              <p className="mt-1 truncate text-xs text-[#7b877f]">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => (picking ? setPicking(false) : void startPicking())}
              className="shrink-0 whitespace-nowrap rounded-full bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              {picking ? "Cancel" : "New message"}
            </button>
          </div>

          <div className="shrink-0 border-b border-[#edf2ec] px-4 py-3">
            <input
              value={picking ? contactSearch : search}
              onChange={(event) =>
                picking ? setContactSearch(event.target.value) : setSearch(event.target.value)
              }
              placeholder={picking ? "Search people..." : "Search conversations..."}
              className="w-full rounded-full border border-[#dfe8df] bg-[#f8faf7] px-4 py-2.5 text-sm outline-none placeholder:text-[#a0aaa3] focus:ring-2 focus:ring-[#d7f7d8]"
            />
          </div>

          <div
            className={`${fitViewport ? "min-h-0 flex-1 overscroll-contain" : "h-[calc(760px-136px)]"} overflow-y-auto px-3 py-3`}
          >
            {picking ? (
              contacts === null ? (
                <p className="px-4 py-6 text-center text-sm text-[#7b877f]">Loading people...</p>
              ) : filteredContacts.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#7b877f]">No one to message.</p>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.user_id}
                    type="button"
                    onClick={() => void startChat(contact.user_id)}
                    className="mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-[#f8faf7]"
                  >
                    <Avatar label={contact.name} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#203028]">
                        {contact.name}
                      </span>
                      <span className="block text-xs text-[#7b877f]">{contact.role}</span>
                    </span>
                  </button>
                ))
              )
            ) : loading ? (
              <p className="px-4 py-6 text-center text-sm text-[#7b877f]">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm leading-6 text-[#7b877f]">
                {conversations.length === 0
                  ? "No conversations yet. Use New message to start one."
                  : "No conversations match your search."}
              </p>
            ) : (
              filtered.map((conversation) => (
                <ConversationRow
                  key={conversation.conversation_id}
                  conversation={conversation}
                  selected={conversation.conversation_id === selectedId}
                  onSelect={() => select(conversation.conversation_id)}
                />
              ))
            )}
          </div>
        </aside>

        <section
          className={`flex ${fitViewport ? "min-h-0 overflow-hidden" : "min-h-[760px]"} min-w-0 flex-col bg-[#fbfcfb]`}
        >
          <header className="flex h-[76px] shrink-0 items-center border-b border-[#edf2ec] bg-white px-6">
            {selected ? (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar label={selected.title} group={selected.type === "Group"} />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-[#203028]">
                    {selected.title}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[#7b877f]">{selected.subtitle}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#7b877f]">Select a conversation</p>
            )}
          </header>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6"
            onClick={() => setOpenMenuId(null)}
          >
            {error && (
              <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            {selected && messages.length === 0 && (
              <div className="mx-auto max-w-sm rounded-2xl bg-white px-5 py-4 text-center text-sm text-[#7b877f]">
                No messages yet. Start the conversation below.
              </div>
            )}

            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.message_id}
                  message={message}
                  menuOpen={openMenuId === message.message_id}
                  onMenu={() =>
                    setOpenMenuId(openMenuId === message.message_id ? null : message.message_id)
                  }
                  onUnsend={() => void handleUnsend(message.message_id)}
                />
              ))}
            </div>
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-[#edf2ec] bg-white px-5 py-4">
            {windowInfo?.applies && (
              <div
                className={`mb-3 rounded-xl border px-4 py-3 text-xs font-semibold ${
                  windowInfo.open
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {windowInfo.open
                  ? `Students can send messages until ${clockLabel(windowInfo.end_time)}.`
                  : `Messaging is closed. Students can send from ${clockLabel(windowInfo.start_time)} to ${clockLabel(windowInfo.end_time)}.`}
              </div>
            )}

            {sendError && <p className="mb-3 text-xs font-semibold text-rose-600">{sendError}</p>}

            <div className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-[#f8faf7] px-4 py-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleSend();
                }}
                maxLength={2000}
                disabled={!selected || !canSend}
                placeholder={
                  !selected
                    ? "Select a conversation"
                    : canSend
                      ? "Write a message..."
                      : "Messaging is currently closed"
                }
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a0aaa3] disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!selected || !canSend || sending || !input.trim()}
                className="rounded-full bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:cursor-not-allowed disabled:bg-[#aab3ad]"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>,
  );
}

function Avatar({ label, group = false }: { label: string; group?: boolean }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d7f7d8] text-sm font-semibold text-[#203028]">
      {group ? "G" : label.charAt(0).toUpperCase()}
    </div>
  );
}

function ConversationRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ApiConversation;
  selected: boolean;
  onSelect: () => void;
}) {
  const last = conversation.last_message;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mb-1 w-full rounded-2xl px-4 py-3 text-left transition ${
        selected ? "bg-[#f2f5f3]" : "hover:bg-[#f8faf7]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-[#203028]">{conversation.title}</p>
        {last && (
          <span className="shrink-0 text-[10px] font-medium text-[#9ba69d]">
            {messageTime(last.sent_at)}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p
          className={`truncate text-xs leading-5 ${
            conversation.unread > 0 ? "font-semibold text-[#203028]" : "text-[#7b877f]"
          }`}
        >
          {last ? `${last.mine ? "You: " : ""}${last.text}` : conversation.subtitle}
        </p>
        {conversation.unread > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#123f2b] px-1.5 text-[10px] font-semibold text-white">
            {conversation.unread > 99 ? "99+" : conversation.unread}
          </span>
        )}
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  menuOpen,
  onMenu,
  onUnsend,
}: {
  message: ApiMessage;
  menuOpen: boolean;
  onMenu: () => void;
  onUnsend: () => void;
}) {
  const mine = message.mine;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[72%]">
        <div className={`flex items-start gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
          <div
            className={`min-w-[120px] max-w-full rounded-2xl px-5 py-3 text-sm leading-6 ${
              message.unsent
                ? "border border-dashed border-[#dfe8df] bg-white text-[#9ba69d]"
                : mine
                  ? "bg-[#eef5ff] text-[#203028]"
                  : "bg-[#eef1ef] text-[#203028]"
            }`}
          >
            <p className="whitespace-pre-wrap break-words text-left">
              {message.unsent ? "This message was unsent." : message.content}
            </p>
          </div>

          {mine && !message.unsent && (
            <div className="relative mt-1" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={onMenu}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-[#7b877f] transition hover:bg-white hover:text-[#203028]"
                aria-label="Message options"
              >
                ⋯
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-30 w-40 overflow-hidden rounded-xl border border-[#dfe8df] bg-white text-left shadow-[0_16px_40px_rgba(31,42,36,0.14)]">
                  <button
                    type="button"
                    onClick={onUnsend}
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
            mine ? "justify-end" : "justify-start"
          }`}
        >
          {!mine && <span>{message.sender_name}</span>}
          {!mine && <span>•</span>}
          <span>{messageTime(message.sent_at)}</span>
        </div>
      </div>
    </div>
  );
}
