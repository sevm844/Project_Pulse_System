export type MessagingSchedule = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  note: string;
};

export const MESSAGING_SCHEDULE_UPDATED_EVENT =
  "project-pulse-messaging-schedule-updated";

const MESSAGING_SCHEDULE_STORAGE_KEY = "project-pulse-messaging-schedule";

export const defaultMessagingSchedule: MessagingSchedule = {
  enabled: true,
  startTime: "05:00",
  endTime: "20:00",
  note: "Students can message during the configured availability window.",
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function parseMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function isTimeWithinWindow(now: Date, startTime: string, endTime: string) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseMinutes(startTime);
  const endMinutes = parseMinutes(endTime);

  if (startMinutes === endMinutes) return true;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function getStoredMessagingSchedule() {
  if (!canUseStorage()) return defaultMessagingSchedule;

  const saved = window.localStorage.getItem(MESSAGING_SCHEDULE_STORAGE_KEY);

  if (!saved) {
    saveStoredMessagingSchedule(defaultMessagingSchedule);
    return defaultMessagingSchedule;
  }

  return JSON.parse(saved) as MessagingSchedule;
}

export function saveStoredMessagingSchedule(schedule: MessagingSchedule) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    MESSAGING_SCHEDULE_STORAGE_KEY,
    JSON.stringify(schedule),
  );
  window.dispatchEvent(new Event(MESSAGING_SCHEDULE_UPDATED_EVENT));
}

export function isMessagingAllowedNow(
  schedule = getStoredMessagingSchedule(),
  now = new Date(),
) {
  if (!schedule.enabled) return true;

  return isTimeWithinWindow(now, schedule.startTime, schedule.endTime);
}

export function formatScheduleWindow(schedule: MessagingSchedule) {
  return `${schedule.startTime} - ${schedule.endTime}`;
}
