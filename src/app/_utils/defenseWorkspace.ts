export const DEFENSE_TABS = [
  ["schedule", "Schedule of Defense"],
  ["redefense", "Re-defense"],
  ["reminders", "Reminders"],
  ["files", "Files & Presentations"],
] as const;

export type DefenseTab = (typeof DEFENSE_TABS)[number][0];

export function getCourseDefenseId(course: string, adviserId: string) {
  return `${encodeURIComponent(course)}--${encodeURIComponent(adviserId)}`;
}

export type DefenseWorkspace = {
  stage: string;
  date: string;
  time: string;
  venue: string;
  status: "Pending" | "Scheduled" | "Completed" | "Cancelled";
  panelists: string;
  scheduleNotes: string;
  redefenseRequired: boolean;
  redefenseDate: string;
  redefenseTime: string;
  redefenseVenue: string;
  redefenseReason: string;
  reminders: string;
  deadline: string;
  manuscriptUrl: string;
  presentationUrl: string;
  demoUrl: string;
  fileInstructions: string;
  updatedAt: string;
  updatedBy: string;
};

export type DefenseScheduleEntry = DefenseWorkspace & {
  id: string;
  course: string;
  groupId: string;
  groupName: string;
  section: string;
  projectTitle: string;
  members: string;
  adviserId: string;
  adviserName: string;
  endTime: string;
};

export function validateDefenseSchedule(value: DefenseScheduleEntry) {
  if (!value.groupId || !value.groupName.trim()) return "Choose a group to schedule.";
  if (!value.stage.trim()) return "Enter the defense stage.";
  if (!value.date || !value.time || !value.venue.trim()) return "Enter the defense date, start time, and venue.";
  if (value.endTime && value.endTime <= value.time) return "End time must be later than the start time.";
  return validateDefenseWorkspace(value);
}

export function emptyDefenseWorkspace(stage = "Proposal Defense"): DefenseWorkspace {
  return {
    stage, date: "", time: "", venue: "", status: "Pending", panelists: "",
    scheduleNotes: "", redefenseRequired: false, redefenseDate: "",
    redefenseTime: "", redefenseVenue: "", redefenseReason: "",
    reminders: "", deadline: "", manuscriptUrl: "", presentationUrl: "",
    demoUrl: "", fileInstructions: "", updatedAt: "", updatedBy: "",
  };
}

export function safeDefenseLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function validateDefenseWorkspace(value: DefenseWorkspace) {
  if (value.status === "Scheduled" && (!value.date || !value.time || !value.venue.trim())) {
    return "Enter the defense date, time, and venue before marking it Scheduled.";
  }
  if (value.redefenseRequired && (!value.redefenseDate || !value.redefenseTime || !value.redefenseVenue.trim() || !value.redefenseReason.trim())) {
    return "Complete the re-defense date, time, venue, and reason.";
  }
  for (const [label, url] of [["Manuscript", value.manuscriptUrl], ["Presentation", value.presentationUrl], ["System demo", value.demoUrl]]) {
    if (url && !safeDefenseLink(url)) return `${label} must use a valid http or https link.`;
  }
  return "";
}
