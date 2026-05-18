export type StoredFeedbackStatus = "Pending" | "Addressed" | "Verified";

export type StoredFeedbackItem = {
  id: number;
  reviewId: number;
  groupName: string;
  course: string;
  section: string;
  projectTitle: string;
  documentTitle: string;
  chapter: string;
  version: string;
  comment: string;
  detail: string;
  documentCommentId?: string;
  selectedText?: string;
  startOffset?: number;
  endOffset?: number;
  adviserName: string;
  date: string;
  status: StoredFeedbackStatus;
  studentResponse: string;
  createdAt: string;
  updatedAt: string;
};

const FEEDBACK_STORAGE_KEY = "project-pulse-shared-feedback-items";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getStoredFeedbackItems() {
  if (!canUseStorage()) return [];

  const saved = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (!saved) return [];

  return JSON.parse(saved) as StoredFeedbackItem[];
}

export function saveStoredFeedbackItems(items: StoredFeedbackItem[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(items));
}

export function addStoredFeedbackItem(
  item: Omit<
    StoredFeedbackItem,
    "id" | "date" | "status" | "studentResponse" | "createdAt" | "updatedAt"
  >,
) {
  const now = new Date();

  const nextItem: StoredFeedbackItem = {
    ...item,
    id: Date.now(),
    date: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    status: "Pending",
    studentResponse: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const items = getStoredFeedbackItems();
  saveStoredFeedbackItems([nextItem, ...items]);

  return nextItem;
}

export function updateStoredFeedbackItem(
  id: number,
  updates: Partial<StoredFeedbackItem>,
) {
  const items = getStoredFeedbackItems().map((item) =>
    item.id === id
      ? {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  saveStoredFeedbackItems(items);
  return items;
}

export function getChapterFromDocumentTitle(documentTitle: string) {
  const chapterMatch = documentTitle.match(/Chapter\s\d/i);
  if (chapterMatch) return chapterMatch[0];

  if (documentTitle.toLowerCase().includes("proposal")) return "Proposal";
  if (documentTitle.toLowerCase().includes("monitoring")) {
    return "Monitoring Form";
  }
  if (documentTitle.toLowerCase().includes("defense")) return "Defense Files";

  return "Chapter 1";
}
