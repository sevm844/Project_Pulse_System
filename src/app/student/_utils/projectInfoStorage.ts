export const PROJECT_INFO_STORAGE_KEY = "project-pulse-student-project-info";

export type EditableProjectInfo = {
  groupName: string;
  groupCode: string;
  title: string;
  abstract: string;
};

// Ignore legacy fields that students are no longer allowed to override.
export function getEditableProjectInfo(value: unknown): Partial<EditableProjectInfo> {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const result: Partial<EditableProjectInfo> = {};
  for (const key of ["groupName", "groupCode", "title", "abstract"] as const) {
    if (typeof source[key] === "string") result[key] = source[key];
  }
  return result;
}
