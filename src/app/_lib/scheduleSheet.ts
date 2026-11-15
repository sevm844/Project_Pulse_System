// The logic behind the defense schedule sheet: filling the time slots for many groups, spotting a room or a panelist that is
// booked twice, and reading dates and times pasted from Google Sheets or Excel. Pure functions, no screen code.

export type Slot = { date: string; time: string };

export type FillOptions = {
  startDate: string; // YYYY-MM-DD, the first day
  startTime: string; // HH:MM, when each day starts
  minutes: number; // length of one defense
  dayEnd: string; // HH:MM, no defense may run past this
  lunchStart: string; // HH:MM, "" for no lunch break
  lunchEnd: string;
  days: number[]; // weekdays that can be used, 0 = Sunday ... 6 = Saturday
};

export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);

  return h * 60 + (m || 0);
};

export const fromMinutes = (total: number) => `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

export const endTime = (time: string, minutes: number) => fromMinutes(toMinutes(time) + minutes);

// Dates are handled as UTC midnights so the user's time zone can never move a day.
const parseDay = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);

  return Date.UTC(y, m - 1, d);
};
const formatDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY = 86_400_000;

// The first allowed weekday on or after `date`.
function nextAllowed(date: string, days: number[]): string {
  let ms = parseDay(date);

  for (let i = 0; i < 8; i++) {
    if (days.includes(new Date(ms).getUTCDay())) return formatDay(ms);
    ms += DAY;
  }

  return date;
}

// Gives each of `count` groups its own slot, one after the other: skipping the lunch break, never running past the end of the
// day, and moving to the next allowed day when a day is full. Returns [] when the options cannot fit even one defense.
export function autoFillSlots(count: number, o: FillOptions): Slot[] {
  const start = toMinutes(o.startTime);
  const end = toMinutes(o.dayEnd);
  const lunch = o.lunchStart && o.lunchEnd ? [toMinutes(o.lunchStart), toMinutes(o.lunchEnd)] : null;

  if (!o.startDate || o.days.length === 0 || o.minutes < 1 || end - start < o.minutes) return [];
  if (lunch && lunch[0] <= start && lunch[1] >= end) return [];

  const slots: Slot[] = [];
  let date = nextAllowed(o.startDate, o.days);
  let cursor = start;

  while (slots.length < count) {
    if (lunch) {
      // Starting inside the break, or running into it: the defense begins when the break ends.
      if (cursor >= lunch[0] && cursor < lunch[1]) cursor = lunch[1];
      else if (cursor < lunch[0] && cursor + o.minutes > lunch[0]) cursor = lunch[1];
    }

    if (cursor + o.minutes > end) {
      date = nextAllowed(formatDay(parseDay(date) + DAY), o.days);
      cursor = start;
      continue;
    }

    slots.push({ date, time: fromMinutes(cursor) });
    cursor += o.minutes;
  }

  return slots;
}

// ---- double booking

export type SheetRow = {
  key: string;
  groupName: string;
  date: string;
  time: string;
  minutes: number;
  venue: string;
  panel: number[];
  defenseId: number | null; // set for a defense that already exists
};

export type BusySlot = { defense_id: number; date: string; time: string; minutes: number; venue: string | null; panelist_ids: number[] };

const overlaps = (aDate: string, aTime: string, aMin: number, bDate: string, bTime: string, bMin: number) => {
  if (aDate !== bDate) return false;
  const a = toMinutes(aTime);
  const b = toMinutes(bTime);

  return a < b + bMin && b < a + aMin;
};

const sameRoom = (a: string, b: string | null) => a.trim() !== "" && a.trim().toLowerCase() === (b ?? "").trim().toLowerCase();

const clock12 = (time: string) => {
  const m = toMinutes(time);

  return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m >= 720 ? "PM" : "AM"}`;
};

// What is wrong with each row, by key: a date in the past, a room used twice, a panelist on two panels at the same time (with the
// other rows of the sheet and with defenses that are already scheduled). A row that is fine has no entry.
export function findIssues(rows: SheetRow[], busy: BusySlot[], today: string, panelistNames: Map<number, string>): Map<string, string[]> {
  const issues = new Map<string, string[]>();
  const add = (key: string, message: string) => issues.set(key, [...(issues.get(key) ?? []), message]);
  const own = new Set(rows.map((r) => r.defenseId).filter((id): id is number => id !== null));

  for (const r of rows) {
    if (!r.date || !r.time) continue;
    if (r.date < today) add(r.key, "This date has passed.");

    for (const o of rows) {
      if (o.key === r.key || !o.date || !o.time || !overlaps(r.date, r.time, r.minutes, o.date, o.time, o.minutes)) continue;
      if (sameRoom(r.venue, o.venue)) add(r.key, `${r.venue.trim()} is also used by ${o.groupName} at ${clock12(o.time)}.`);
      for (const id of r.panel.filter((p) => o.panel.includes(p))) add(r.key, `${panelistNames.get(id) ?? "A panelist"} is also on the panel of ${o.groupName} at ${clock12(o.time)}.`);
    }

    for (const b of busy) {
      if (own.has(b.defense_id) || !overlaps(r.date, r.time, r.minutes, b.date, b.time, b.minutes)) continue;
      if (sameRoom(r.venue, b.venue)) add(r.key, `${r.venue.trim()} is already taken at ${clock12(b.time)}.`);
      for (const id of r.panel.filter((p) => b.panelist_ids.includes(p))) add(r.key, `${panelistNames.get(id) ?? "A panelist"} is already booked at ${clock12(b.time)}.`);
    }
  }

  for (const [key, list] of issues) issues.set(key, [...new Set(list)]);

  return issues;
}

// ---- pasting from Google Sheets or Excel

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function parseDateCell(text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) return valid(+m[1], +m[2], +m[3]);

  // 11/20/2026 (month first, as Google Sheets and Excel show it in the Philippines)
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t);
  if (m) return valid(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[1], +m[2]);

  // Nov 20, 2026 / November 20 2026 / 20 Nov 2026
  m = /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/.exec(t);
  if (m) return valid(+m[3], MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1, +m[2]);
  m = /^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/.exec(t);
  if (m) return valid(+m[3], MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1, +m[1]);

  return null;
}

function valid(y: number, month: number, d: number): string | null {
  if (month < 1 || month > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, month - 1, d));

  return date.getUTCMonth() === month - 1 ? date.toISOString().slice(0, 10) : null;
}

export function parseTimeCell(text: string): string | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*([AaPp])?\.?[Mm]?\.?$/.exec(text.trim());
  if (!m) return null;

  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  if (min > 59) return null;

  if (m[3]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[3].toLowerCase() === "p" ? 12 : 0);
  } else if (h > 23) {
    return null;
  }

  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// ---- the time left: what a group may still pick

export type TimeWindow = {
  start: string; // HH:MM, the earliest start of the day
  end: string; // HH:MM, nothing may run past this
  lunchStart: string; // "" for no lunch break
  lunchEnd: string;
  step: number; // minutes between the choices (15)
};

// The stretches of that day that this row cannot use: the ones taken by another row of the sheet or by a defense that already
// exists, in the same room or with a panelist this row also has. With no room and no panel chosen yet, nothing is taken.
function takenFor(row: SheetRow, peers: SheetRow[], busy: BusySlot[]): [number, number][] {
  if (!row.date) return [];

  const clash = (venue: string | null, panel: number[]) => sameRoom(row.venue, venue) || row.panel.some((p) => panel.includes(p));
  const own = new Set(peers.map((p) => p.defenseId).filter((id): id is number => id !== null));
  const taken: [number, number][] = [];

  for (const o of peers) {
    if (o.key === row.key || o.date !== row.date || !o.time || !clash(o.venue, o.panel)) continue;
    taken.push([toMinutes(o.time), toMinutes(o.time) + o.minutes]);
  }
  for (const b of busy) {
    if (own.has(b.defense_id) || b.date !== row.date || !clash(b.venue, b.panelist_ids)) continue;
    taken.push([toMinutes(b.time), toMinutes(b.time) + b.minutes]);
  }

  return taken;
}

// Every start time this row can still pick: not in the lunch break, and not inside time that is already used.
export function availableStarts(row: SheetRow, peers: SheetRow[], busy: BusySlot[], win: TimeWindow): string[] {
  const taken = takenFor(row, peers, busy);
  const lunch = win.lunchStart && win.lunchEnd ? [toMinutes(win.lunchStart), toMinutes(win.lunchEnd)] : null;
  const out: string[] = [];

  for (let t = toMinutes(win.start); t + win.step <= toMinutes(win.end); t += win.step) {
    if (lunch && t + win.step > lunch[0] && t < lunch[1]) continue;
    if (taken.some(([from, to]) => t < to && t + win.step > from)) continue;
    out.push(fromMinutes(t));
  }

  return out;
}

// Every end time that works for this start: as far as the next used stretch, the lunch break or the end of the day.
export function availableEnds(row: SheetRow, startTime: string, peers: SheetRow[], busy: BusySlot[], win: TimeWindow): string[] {
  if (!startTime) return [];

  const s = toMinutes(startTime);
  let limit = toMinutes(win.end);
  if (win.lunchStart && win.lunchEnd && s < toMinutes(win.lunchStart)) limit = Math.min(limit, toMinutes(win.lunchStart));

  for (const [from, to] of takenFor(row, peers, busy)) {
    if (s >= from && s < to) return []; // the start itself is already used
    if (from > s) limit = Math.min(limit, from);
  }

  const out: string[] = [];
  for (let e = s + win.step; e <= limit; e += win.step) out.push(fromMinutes(e));

  return out;
}

// ---- the quick fill decides the length and the days itself

export const STANDARD_MINUTES = 45;
export const SHORT_MINUTES = 30;
const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Monday to Saturday

// Everything the adviser gives: the first day, the working hours and the lunch break. The system chooses the rest: each group gets
// 45 minutes (30 when that is what it takes to keep every group on the first day), and when a day is full the next working day
// (Monday to Saturday) is used. Returns the slots and the length that was chosen, or no slots when nothing fits.
export function planSchedule(
  count: number,
  o: { startDate: string; startTime: string; dayEnd: string; lunchStart: string; lunchEnd: string },
): { slots: Slot[]; minutes: number } {
  const at = (minutes: number) => autoFillSlots(count, { ...o, minutes, days: WORKING_DAYS });
  const oneDay = (slots: Slot[]) => new Set(slots.map((s) => s.date)).size === 1;

  const standard = at(STANDARD_MINUTES);
  if (standard.length === count && oneDay(standard)) return { slots: standard, minutes: STANDARD_MINUTES };

  const short = at(SHORT_MINUTES);
  if (short.length === count && oneDay(short)) return { slots: short, minutes: SHORT_MINUTES };

  // Too many groups for one day: keep the standard length and carry on the next day.
  if (standard.length === count) return { slots: standard, minutes: STANDARD_MINUTES };

  // The day is too short for 45 minutes: use what fits.
  return short.length === count ? { slots: short, minutes: SHORT_MINUTES } : { slots: [], minutes: STANDARD_MINUTES };
}
