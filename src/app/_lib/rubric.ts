import { apiFetch } from "./api";
import type { ApiDefense } from "./defenses";

// The Proposal Defense Rubric of the College of Information and Communications Technology: five sections of two criteria, each rated
// 4 (Excellent) to 1 (Needs Improvement), 40 points in all. The same criteria are used for every course; only the course name in the
// title changes. (The server keeps the same list in App\Support\ProposalRubric.)

export type RubricSection = { title: string; criteria: { key: string; label: string }[] };

export const RUBRIC_SECTIONS: RubricSection[] = [
  {
    title: "Introduction",
    criteria: [
      { key: "intro_problem", label: "Clear identification of the problem" },
      { key: "intro_context", label: "Contextualization of the problem within IT" },
    ],
  },
  {
    title: "Research Objectives & Questions",
    criteria: [
      { key: "obj_objectives", label: "Concise and well-defined objectives" },
      { key: "obj_questions", label: "Relevant and researchable questions" },
    ],
  },
  {
    title: "Technical Feasibility",
    criteria: [
      { key: "tech_feasibility", label: "Explanation of technological feasibility" },
      { key: "tech_challenges", label: "Identification of potential challenges" },
    ],
  },
  {
    title: "Timeline and Resources",
    criteria: [
      { key: "time_timeline", label: "Realistic timeline for completion" },
      { key: "time_resources", label: "Adequate resources identified" },
    ],
  },
  {
    title: "Presentation",
    criteria: [
      { key: "pres_slides", label: "Clarity and organization of slides" },
      { key: "pres_engage", label: "Engagement and ability to address questions" },
    ],
  },
];

export const RUBRIC_KEYS = RUBRIC_SECTIONS.flatMap((s) => s.criteria.map((c) => c.key));
export const RUBRIC_MAX = RUBRIC_KEYS.length * 4;

export const RATING_LEVELS = [
  { value: 4, label: "Excellent" },
  { value: 3, label: "Good" },
  { value: 2, label: "Fair" },
  { value: 1, label: "Needs Improvement" },
] as const;

export type Ratings = Record<string, number>;
export type Rubric = { version: number; ratings: Ratings; total: number; max: number };

// Only the Proposal Defense has a rubric so far; the other defenses keep their plain score.
export const hasRubric = (defenseType: string) => defenseType === "Proposal Defense";

export const rubricTitle = (course: string) => `${course} Capstone Proposal Defense Rubric`;

export const rubricTotal = (ratings: Ratings) => RUBRIC_KEYS.reduce((sum, key) => sum + (ratings[key] ?? 0), 0);

export const rubricComplete = (ratings: Ratings) => RUBRIC_KEYS.every((key) => ratings[key] >= 1 && ratings[key] <= 4);

// One filled-in rubric, as the paper form: the group, the ratings, the comments and the signature picture.
export type ApiRubricForm = {
  defense: ApiDefense;
  panelist: string;
  rubric: Rubric;
  score: number;
  recommendation: string;
  comments: string | null;
  signature: string | null;
  signed_at: string | null;
};

export const fetchRubric = (defenseId: number, panelistId: number) => apiFetch<ApiRubricForm>(`/defenses/${defenseId}/rubric/${panelistId}`);

export const submitRubric = (defenseId: number, ratings: Ratings, recommendation: string, comments: string) =>
  apiFetch<ApiDefense>(`/defenses/${defenseId}/evaluation`, {
    method: "PUT",
    body: JSON.stringify({ ratings, recommendation, remarks: comments.trim() || null }),
  });
