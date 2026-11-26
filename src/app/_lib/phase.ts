import type { ApiProgress } from "./progress";

// Where a group really is in the whole capstone, for the "Stage" filters and tags of the adviser's and the Dean's group lists (the consultant's request, 2026-11-26:
// "view teams by status, e.g. Beta only"). The proposal stage only lasts until "Ready for Proposal Defense"; after that the group is in one of the defenses, and the
// progress tracker (which the backend works out from the defenses, requirements and archive) says which.
export const PHASE_CHOICES = [
  "Title Proposal",
  "Client Consultation",
  "Proposal Defense",
  "Alpha Defense",
  "Beta Defense",
  "Omega Defense",
  "Final Defense",
  "Final Output",
  "Completed",
] as const;

export function placeOf(stage: string, progress?: ApiProgress | null): string {
  if (stage !== "Ready for Proposal Defense") return stage;

  // The progress list may still be loading: a group that is ready is, at the least, at its Proposal Defense.
  if (!progress) return "Proposal Defense";

  return progress.current_phase;
}
