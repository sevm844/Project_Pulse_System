import type { JSONContent } from "@tiptap/react";
import { apiFetch } from "./api";

// The "Letter for Interview": the adviser gives the group the school's sample letter, the students rewrite it for their project
// and print it as a PDF before the adviser sends the group to the Dean. Nothing exists until the adviser gives it.

export type InterviewLetterState =
  | { given: false; can_give: boolean }
  | {
      given: true;
      content: JSONContent;
      revision: number;
      given_by: string | null;
      given_at: string;
      edited_by: string | null;
      edited_at: string | null;
      can_edit: boolean;
    };

export const fetchInterviewLetter = (groupId: number) => apiFetch<InterviewLetterState>(`/groups/${groupId}/interview-letter`);

export const giveInterviewLetter = (groupId: number) => apiFetch<InterviewLetterState>(`/groups/${groupId}/interview-letter`, { method: "POST" });

export const saveInterviewLetter = (groupId: number, content: JSONContent, baseRevision: number) =>
  apiFetch<InterviewLetterState>(`/groups/${groupId}/interview-letter`, {
    method: "PUT",
    body: JSON.stringify({ content, base_revision: baseRevision }),
  });
