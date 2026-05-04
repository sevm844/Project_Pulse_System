export const PROJECT_INFO_STORAGE_KEY = "project-pulse-student-project-info";

export type EditableProjectInfo = {
  groupName: string;
  groupCode: string;
  title: string;
  abstract: string;
  adviser: string;
  stage: string;
  completion: number;
};
