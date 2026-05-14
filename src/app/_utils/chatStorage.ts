import { addNotification, type NotificationRole } from "./notificationStorage";

export type ChatRole =
  | "Student"
  | "Adviser"
  | "Dean"
  | "Coordinator"
  | "Admin"
  | "Panelist"
  | "Grammarian"
  | "Records Staff";

export type ChatThreadType =
  | "group"
  | "adviser"
  | "staff"
  | "announcement"
  | "broadcast"
  | "section";

export type StoredChatThread = {
  id: string;
  type: ChatThreadType;
  label: string;
  description: string;
  meta: string;
  audienceRoles: NotificationRole[];
  course?: string;
  section?: string;
  groupId?: number;
  groupName?: string;
};

export type StoredChatMessage = {
  id: number;
  threadId: string;
  sender: string;
  role: ChatRole;
  text: string;
  time: string;
  createdAt: string;
  attachmentName?: string;
  unsent?: boolean;
};

const CHAT_MESSAGES_STORAGE_KEY = "project-pulse-chat-messages";

export const defaultStudentThreads: StoredChatThread[] = [
  {
    id: "group-chat",
    type: "group",
    label: "Group Chat",
    description: "Private group chat for capstone members",
    meta: "Group",
    audienceRoles: ["Student"],
    groupId: 1,
    groupName: "Project Pulse",
  },
  {
    id: "adviser",
    type: "adviser",
    label: "Anna Cruz",
    description: "Assigned adviser for manuscript review",
    meta: "Adviser",
    audienceRoles: ["Adviser"],
  },
  {
    id: "coordinator",
    type: "staff",
    label: "Capstone Coordinator",
    description: "Schedules, defense notices, and requirements",
    meta: "Coordinator",
    audienceRoles: ["Coordinator"],
  },
  {
    id: "dean-office",
    type: "staff",
    label: "Dean Office",
    description: "Academic monitoring and final approval office",
    meta: "Dean",
    audienceRoles: ["Dean"],
  },
];

export const defaultAdviserThreads: StoredChatThread[] = [
  {
    id: "all-assigned",
    type: "broadcast",
    label: "All Assigned Groups",
    description: "Broadcast message to all assigned groups",
    meta: "Broadcast",
    audienceRoles: ["Student"],
  },
  {
    id: "bsit-4a",
    type: "section",
    label: "BSIT 4A Announcement",
    description: "Announcement for BSIT 4A",
    meta: "Section",
    audienceRoles: ["Student"],
    course: "BSIT",
    section: "4A",
  },
  {
    id: "group-1",
    type: "group",
    label: "Project Pulse",
    description: "Direct group conversation",
    meta: "Group",
    audienceRoles: ["Student"],
    groupId: 1,
    groupName: "Project Pulse",
  },
];

export const defaultDeanThreads: StoredChatThread[] = [
  {
    id: "dean-all-advisers",
    type: "broadcast",
    label: "All Advisers",
    description: "Broadcast announcement to all advisers",
    meta: "Broadcast",
    audienceRoles: ["Adviser"],
  },
  {
    id: "dean-anna-cruz",
    type: "adviser",
    label: "Anna Cruz",
    description: "Adviser for assigned capstone groups",
    meta: "Adviser",
    audienceRoles: ["Adviser"],
  },
  {
    id: "dean-records",
    type: "staff",
    label: "Records Staff",
    description: "Final validation and archive coordination",
    meta: "Records",
    audienceRoles: ["Records Staff"],
  },
];

export const defaultAdminThreads: StoredChatThread[] = [
  {
    id: "admin-all",
    type: "broadcast",
    label: "All Stakeholders",
    description: "System-wide administrative announcement",
    meta: "Broadcast",
    audienceRoles: [
      "Student",
      "Adviser",
      "Dean",
      "Coordinator",
      "Panelist",
      "Grammarian",
      "Records Staff",
    ],
  },
  {
    id: "admin-coordinator",
    type: "staff",
    label: "Coordinator",
    description: "Workflow and schedule coordination",
    meta: "Coordinator",
    audienceRoles: ["Coordinator"],
  },
  {
    id: "admin-records",
    type: "staff",
    label: "Records Staff",
    description: "Archive and repository validation",
    meta: "Records",
    audienceRoles: ["Records Staff"],
  },
];

export const defaultCoordinatorThreads: StoredChatThread[] = [
  {
    id: "coordinator-students",
    type: "broadcast",
    label: "Student Groups",
    description: "Requirement and schedule announcements",
    meta: "Students",
    audienceRoles: ["Student"],
  },
  {
    id: "coordinator-advisers",
    type: "broadcast",
    label: "Advisers",
    description: "Defense and review coordination",
    meta: "Advisers",
    audienceRoles: ["Adviser"],
  },
  {
    id: "coordinator-dean",
    type: "staff",
    label: "Dean Office",
    description: "Executive coordination updates",
    meta: "Dean",
    audienceRoles: ["Dean"],
  },
];

export const defaultPanelistThreads: StoredChatThread[] = [
  {
    id: "panelist-coordinator",
    type: "staff",
    label: "Capstone Coordinator",
    description: "Defense schedule and panel reminders",
    meta: "Coordinator",
    audienceRoles: ["Coordinator"],
  },
  {
    id: "panelist-adviser",
    type: "adviser",
    label: "Anna Cruz",
    description: "Defense review coordination",
    meta: "Adviser",
    audienceRoles: ["Adviser"],
  },
];

export const defaultGrammarianThreads: StoredChatThread[] = [
  {
    id: "grammarian-coordinator",
    type: "staff",
    label: "Capstone Coordinator",
    description: "Grammar review coordination",
    meta: "Coordinator",
    audienceRoles: ["Coordinator"],
  },
  {
    id: "grammarian-records",
    type: "staff",
    label: "Records Staff",
    description: "Final document archive coordination",
    meta: "Records",
    audienceRoles: ["Records Staff"],
  },
];

export const defaultRecordsThreads: StoredChatThread[] = [
  {
    id: "records-admin",
    type: "staff",
    label: "Admin",
    description: "System and repository coordination",
    meta: "Admin",
    audienceRoles: ["Admin"],
  },
  {
    id: "records-dean",
    type: "staff",
    label: "Dean Office",
    description: "Final approval and archive concerns",
    meta: "Dean",
    audienceRoles: ["Dean"],
  },
  {
    id: "records-grammarian",
    type: "staff",
    label: "Grammarian",
    description: "Final manuscript validation",
    meta: "Grammarian",
    audienceRoles: ["Grammarian"],
  },
];

const initialMessages: StoredChatMessage[] = [
  {
    id: 1,
    threadId: "group-chat",
    sender: "Maria Santos",
    role: "Student",
    text: "I uploaded the latest monitoring form draft.",
    time: "8:40 AM",
    createdAt: "2026-05-12T08:40:00.000Z",
    attachmentName: "monitoring-form-draft.docx",
  },
  {
    id: 2,
    threadId: "adviser",
    sender: "Anna Cruz",
    role: "Adviser",
    text: "Please prioritize the unresolved Chapter 2 comments.",
    time: "9:30 AM",
    createdAt: "2026-05-12T09:30:00.000Z",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function threadKey(role: ChatRole) {
  return `project-pulse-${role.toLowerCase().replaceAll(" ", "-")}-chat-threads`;
}

export function getDefaultThreadsForRole(role: ChatRole): StoredChatThread[] {
  if (role === "Student") return defaultStudentThreads;
  if (role === "Adviser") return defaultAdviserThreads;
  if (role === "Dean") return defaultDeanThreads;
  if (role === "Admin") return defaultAdminThreads;
  if (role === "Coordinator") return defaultCoordinatorThreads;
  if (role === "Panelist") return defaultPanelistThreads;
  if (role === "Grammarian") return defaultGrammarianThreads;
  return defaultRecordsThreads;
}

export function getChatThreadsForRole(role: ChatRole) {
  if (!canUseStorage()) return getDefaultThreadsForRole(role);

  const key = threadKey(role);
  const saved = window.localStorage.getItem(key);

  if (!saved) {
    const defaults = getDefaultThreadsForRole(role);
    saveChatThreadsForRole(role, defaults);
    return defaults;
  }

  return JSON.parse(saved) as StoredChatThread[];
}

export function saveChatThreadsForRole(
  role: ChatRole,
  threads: StoredChatThread[],
) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(threadKey(role), JSON.stringify(threads));
}

export function getStudentChatThreads() {
  return getChatThreadsForRole("Student");
}

export function saveStudentChatThreads(threads: StoredChatThread[]) {
  saveChatThreadsForRole("Student", threads);
}

export function getAdviserChatThreads() {
  return getChatThreadsForRole("Adviser");
}

export function saveAdviserChatThreads(threads: StoredChatThread[]) {
  saveChatThreadsForRole("Adviser", threads);
}

export function addStudentChatThread(thread: StoredChatThread) {
  const threads = getStudentChatThreads();

  if (threads.some((item) => item.id === thread.id)) return threads;

  const nextThreads = [thread, ...threads];
  saveStudentChatThreads(nextThreads);

  return nextThreads;
}

export function getStoredChatMessages() {
  if (!canUseStorage()) return initialMessages;

  const saved = window.localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);

  if (!saved) {
    saveStoredChatMessages(initialMessages);
    return initialMessages;
  }

  return JSON.parse(saved) as StoredChatMessage[];
}

export function saveStoredChatMessages(messages: StoredChatMessage[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    CHAT_MESSAGES_STORAGE_KEY,
    JSON.stringify(messages),
  );
}

export function addChatMessage(input: {
  thread: StoredChatThread;
  sender: string;
  role: ChatRole;
  text: string;
  attachmentName?: string;
}) {
  const message: StoredChatMessage = {
    id: Date.now(),
    threadId: input.thread.id,
    sender: input.sender,
    role: input.role,
    text: input.text || "Shared a file.",
    time: formatTime(),
    createdAt: new Date().toISOString(),
    attachmentName: input.attachmentName || undefined,
    unsent: false,
  };

  const messages = getStoredChatMessages();
  saveStoredChatMessages([...messages, message]);

  const audienceRoles = input.thread.audienceRoles || [];

  audienceRoles.forEach((role) => {
    if (role === input.role) return;

    addNotification({
      role,
      title: `New message from ${input.sender}`,
      message: input.attachmentName
        ? `${input.text || "Shared a file."} Attachment: ${input.attachmentName}`
        : input.text || "Shared a file.",
      category: "Message",
      href:
        role === "Student"
          ? "/student/chat"
          : role === "Adviser"
            ? "/adviser/messages"
            : `/${role.toLowerCase().replaceAll(" ", "-")}/messages`,
    });
  });

  return message;
}

export function unsendChatMessage(id: number, role: ChatRole) {
  const messages = getStoredChatMessages().map((message) => {
    if (message.id !== id || message.role !== role) return message;

    return {
      ...message,
      text: "This message was unsent.",
      attachmentName: undefined,
      unsent: true,
    };
  });

  saveStoredChatMessages(messages);
  return messages;
}
