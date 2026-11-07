import { apiFetch } from "./api";

export type ApiConversation = {
  conversation_id: number;
  type: "Direct" | "Group";
  title: string;
  subtitle: string;
  unread: number;
  last_message: {
    text: string;
    sent_at: string;
    mine: boolean;
    unsent: boolean;
  } | null;
};

export type MessagingWindowInfo = {
  applies: boolean;
  open: boolean;
  start_time: string;
  end_time: string;
  note: string;
};

export type ConversationList = {
  window: MessagingWindowInfo;
  unread_total: number;
  items: ApiConversation[];
};

export type ApiMessage = {
  message_id: number;
  sender_id: number;
  sender_name: string;
  mine: boolean;
  content: string;
  unsent: boolean;
  sent_at: string;
};

export type ApiContact = {
  user_id: number;
  name: string;
  role: string;
};

export type MessagingSettings = {
  enabled: boolean;
  start_time: string;
  end_time: string;
  note: string;
  open_now: boolean;
};

export const fetchConversations = () => apiFetch<ConversationList>("/conversations");

export const fetchContacts = () => apiFetch<ApiContact[]>("/contacts");

export const fetchMessages = (conversationId: number) =>
  apiFetch<{ messages: ApiMessage[] }>(`/conversations/${conversationId}/messages`);

export const openDirectChat = (userId: number) =>
  apiFetch<{ conversation_id: number }>("/conversations", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });

export const sendMessage = (conversationId: number, content: string) =>
  apiFetch<ApiMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const unsendMessage = (messageId: number) =>
  apiFetch<ApiMessage>(`/messages/${messageId}`, { method: "DELETE" });

export const fetchMessagingSettings = () => apiFetch<MessagingSettings>("/messaging-settings");

export const saveMessagingSettings = (settings: Omit<MessagingSettings, "open_now">) =>
  apiFetch<MessagingSettings>("/messaging-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });

// "8:40 AM" for today, "Nov 6" for older messages (Manila time).
export function messageTime(value: string) {
  const date = new Date(value);
  const options = { timeZone: "Asia/Manila" } as const;
  const sameDay =
    date.toLocaleDateString("en-PH", options) === new Date().toLocaleDateString("en-PH", options);

  return sameDay
    ? date.toLocaleTimeString("en-PH", { ...options, hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-PH", { ...options, month: "short", day: "numeric" });
}

// 24-hour "17:00" -> "5:00 PM".
export function clockLabel(time: string) {
  const [h = "0", m = "00"] = time.split(":");
  const hour = Number(h);

  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}
