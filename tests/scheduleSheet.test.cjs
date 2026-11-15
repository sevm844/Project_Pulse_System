/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const compiled = { exports: {} };
new Function("module", "exports", ts.transpileModule(fs.readFileSync("src/app/_lib/scheduleSheet.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(compiled, compiled.exports);
const { autoFillSlots, findIssues, parseDateCell, parseTimeCell, endTime } = compiled.exports;

const base = { startDate: "2026-11-23", startTime: "08:00", minutes: 45, dayEnd: "17:00", lunchStart: "12:00", lunchEnd: "13:00", days: [1, 2, 3, 4, 5, 6] };

test("auto-fill gives each group the next slot, one after the other", () => {
  const slots = autoFillSlots(3, base);
  assert.deepEqual(slots, [
    { date: "2026-11-23", time: "08:00" },
    { date: "2026-11-23", time: "08:45" },
    { date: "2026-11-23", time: "09:30" },
  ]);
});

test("auto-fill never lets a defense run into the lunch break: it starts when lunch ends", () => {
  const slots = autoFillSlots(8, base);
  // 08:00 08:45 09:30 10:15 11:00 11:45(would run to 12:30) -> 13:00
  assert.equal(slots[4].time, "11:00");
  assert.equal(slots[5].time, "13:00");
  assert.ok(slots.every((s) => s.time < "12:00" || s.time >= "13:00"));
});

test("auto-fill moves to the next day when a day is full, and skips days that are not allowed", () => {
  const slots = autoFillSlots(30, { ...base, startDate: "2026-11-27", days: [1, 2, 3, 4, 5] }); // a Friday
  assert.equal(slots[0].date, "2026-11-27");
  const dates = [...new Set(slots.map((s) => s.date))];
  assert.ok(dates.length >= 2);
  assert.equal(dates[1], "2026-11-30"); // Monday: the weekend is skipped
  for (const d of dates) assert.ok(![0, 6].includes(new Date(d + "T00:00:00Z").getUTCDay()));
  const last = slots.filter((s) => s.date === dates[0]).pop();
  assert.ok(last.time < "17:00");
});

test("auto-fill: a day starts at the first allowed weekday on or after the start date", () => {
  const slots = autoFillSlots(1, { ...base, startDate: "2026-11-22", days: [1, 2, 3, 4, 5] }); // a Sunday
  assert.equal(slots[0].date, "2026-11-23");
});

test("auto-fill: nothing that cannot fit is invented", () => {
  assert.deepEqual(autoFillSlots(3, { ...base, minutes: 600 }), []);
  assert.deepEqual(autoFillSlots(3, { ...base, days: [] }), []);
  assert.deepEqual(autoFillSlots(3, { ...base, startDate: "" }), []);
  assert.deepEqual(autoFillSlots(0, base), []);
});

test("auto-fill works with no lunch break", () => {
  const slots = autoFillSlots(4, { ...base, lunchStart: "", lunchEnd: "", dayEnd: "11:00", minutes: 60 });
  assert.deepEqual(slots.map((s) => s.date + " " + s.time), ["2026-11-23 08:00", "2026-11-23 09:00", "2026-11-23 10:00", "2026-11-24 08:00"]);
});

const row = (key, over) => ({ key, groupName: key, date: "2026-12-01", time: "09:00", minutes: 45, venue: "Room 1", panel: [1, 2], defenseId: null, ...over });
const names = new Map([[1, "Dr. A"], [2, "Dr. B"], [3, "Dr. C"]]);

test("a room used twice at overlapping times is flagged on both rows, naming the other group", () => {
  const rows = [row("Alpha"), row("Beta", { time: "09:30", panel: [3] })];
  const issues = findIssues(rows, [], "2026-11-01", names);
  assert.match(issues.get("Alpha")[0], /Room 1 is also used by Beta at 9:30 AM/);
  assert.match(issues.get("Beta")[0], /Room 1 is also used by Alpha at 9:00 AM/);
});

test("back to back is not a clash, and a room is compared without caring about capitals or spaces", () => {
  const rows = [row("Alpha"), row("Beta", { time: "09:45", panel: [3] })];
  assert.equal(findIssues(rows, [], "2026-11-01", names).size, 0);
  const same = [row("Alpha"), row("Beta", { time: "09:30", venue: " room 1 ", panel: [3] })];
  assert.equal(findIssues(same, [], "2026-11-01", names).size, 2);
});

test("a panelist on two panels at the same time is flagged by name, even in different rooms", () => {
  const rows = [row("Alpha"), row("Beta", { venue: "Room 2", panel: [2, 3] })];
  const issues = findIssues(rows, [], "2026-11-01", names);
  assert.match(issues.get("Alpha")[0], /Dr\. B is also on the panel of Beta/);
});

test("different days never clash", () => {
  const rows = [row("Alpha"), row("Beta", { date: "2026-12-02" })];
  assert.equal(findIssues(rows, [], "2026-11-01", names).size, 0);
});

test("defenses that already exist count, except the sheet's own rows being edited", () => {
  const busy = [{ defense_id: 50, date: "2026-12-01", time: "09:15", minutes: 45, venue: "Room 1", panelist_ids: [1] }];
  const issues = findIssues([row("Alpha")], busy, "2026-11-01", names);
  assert.equal(issues.get("Alpha").length, 2); // the room and the panelist
  const own = findIssues([row("Alpha", { defenseId: 50 })], busy, "2026-11-01", names);
  assert.equal(own.size, 0);
});

test("a date in the past is flagged", () => {
  assert.match(findIssues([row("Alpha", { date: "2026-10-01" })], [], "2026-11-01", names).get("Alpha")[0], /has passed/);
});

test("rows without a date or time are left to the 'missing' check, not reported as clashes", () => {
  assert.equal(findIssues([row("Alpha", { date: "" }), row("Beta")], [], "2026-11-01", names).size, 0);
});

test("pasted dates: Google Sheets, Excel and written-out forms", () => {
  assert.equal(parseDateCell("2026-11-20"), "2026-11-20");
  assert.equal(parseDateCell("11/20/2026"), "2026-11-20");
  assert.equal(parseDateCell("1/5/2027"), "2027-01-05");
  assert.equal(parseDateCell("Nov 20, 2026"), "2026-11-20");
  assert.equal(parseDateCell("November 20 2026"), "2026-11-20");
  assert.equal(parseDateCell("20 Nov 2026"), "2026-11-20");
  assert.equal(parseDateCell("2/30/2026"), null);
  assert.equal(parseDateCell("soon"), null);
  assert.equal(parseDateCell(""), null);
});

test("pasted times: 24-hour and AM/PM", () => {
  assert.equal(parseTimeCell("9:00"), "09:00");
  assert.equal(parseTimeCell("09:05"), "09:05");
  assert.equal(parseTimeCell("9:00 AM"), "09:00");
  assert.equal(parseTimeCell("1:30pm"), "13:30");
  assert.equal(parseTimeCell("12:00 PM"), "12:00");
  assert.equal(parseTimeCell("12:15 AM"), "00:15");
  assert.equal(parseTimeCell("13:30"), "13:30");
  assert.equal(parseTimeCell("25:00"), null);
  assert.equal(parseTimeCell("13:30 PM"), null);
  assert.equal(parseTimeCell("noon"), null);
});

test("end time is the start plus the length", () => {
  assert.equal(endTime("08:00", 45), "08:45");
  assert.equal(endTime("11:30", 60), "12:30");
});

// ---- the time left

const { availableStarts, availableEnds } = compiled.exports;
const win = { start: "08:00", end: "12:00", lunchStart: "", lunchEnd: "", step: 15 };
const sheetRow = (key, over) => ({ key, groupName: key, date: "2026-12-01", time: "", minutes: 45, venue: "Room 1", panel: [1], defenseId: null, ...over });

test("a group that has not picked a time yet is offered every time of the day", () => {
  const starts = availableStarts(sheetRow("Beta"), [sheetRow("Beta")], [], win);
  assert.equal(starts[0], "08:00");
  assert.equal(starts.length, 16); // 08:00 .. 11:45
});

test("the time one group took is no longer offered to the next group in the same room", () => {
  const alpha = sheetRow("Alpha", { time: "08:00" }); // 08:00 - 08:45
  const beta = sheetRow("Beta");
  const starts = availableStarts(beta, [alpha, beta], [], win);
  assert.ok(!starts.includes("08:00") && !starts.includes("08:15") && !starts.includes("08:30"));
  assert.equal(starts[0], "08:45"); // exactly when Alpha ends
});

test("what is left shrinks the choice of end times: the next group cannot end after the one that follows it", () => {
  const alpha = sheetRow("Alpha", { time: "09:00" }); // 09:00 - 09:45
  const beta = sheetRow("Beta");
  assert.deepEqual(availableEnds(beta, "08:00", [alpha, beta], [], win), ["08:15", "08:30", "08:45", "09:00"]);
  assert.equal(availableEnds(beta, "09:45", [alpha, beta], [], win).pop(), "12:00");
  assert.deepEqual(availableEnds(beta, "09:15", [alpha, beta], [], win), []); // the start is inside Alpha's time
});

test("a different room and a different panel do not take each other's time", () => {
  const alpha = sheetRow("Alpha", { time: "08:00", venue: "Room 2", panel: [2] });
  const beta = sheetRow("Beta");
  assert.equal(availableStarts(beta, [alpha, beta], [], win)[0], "08:00");
});

test("a panelist who is already busy cannot be given a clashing time, even in another room", () => {
  const alpha = sheetRow("Alpha", { time: "08:00", venue: "Room 2", panel: [1, 3] });
  const beta = sheetRow("Beta", { panel: [3] });
  assert.equal(availableStarts(beta, [alpha, beta], [], win)[0], "08:45");
});

test("another day is not affected", () => {
  const alpha = sheetRow("Alpha", { time: "08:00", date: "2026-12-02" });
  assert.equal(availableStarts(sheetRow("Beta"), [alpha, sheetRow("Beta")], [], win)[0], "08:00");
});

test("defenses that already exist take time too, but the sheet's own rows do not count against themselves", () => {
  const busy = [{ defense_id: 7, date: "2026-12-01", time: "08:00", minutes: 60, venue: "Room 1", panelist_ids: [1] }];
  assert.equal(availableStarts(sheetRow("Beta"), [sheetRow("Beta")], busy, win)[0], "09:00");
  const own = sheetRow("Alpha", { time: "08:00", minutes: 60, defenseId: 7 });
  assert.equal(availableStarts(own, [own], busy, win)[0], "08:00");
});

test("the lunch break is never offered, and no defense may run across it", () => {
  const lunchWin = { ...win, end: "17:00", lunchStart: "12:00", lunchEnd: "13:00" };
  const starts = availableStarts(sheetRow("Beta"), [sheetRow("Beta")], [], lunchWin);
  assert.ok(!starts.includes("12:00") && !starts.includes("12:45") && starts.includes("13:00") && starts.includes("11:45"));
  assert.equal(availableEnds(sheetRow("Beta"), "11:00", [], [], lunchWin).pop(), "12:00");
  assert.equal(availableEnds(sheetRow("Beta"), "13:00", [], [], lunchWin).pop(), "17:00");
});

test("no end times without a start", () => {
  assert.deepEqual(availableEnds(sheetRow("Beta"), "", [], [], win), []);
});

// ---- the quick fill decides the length and the days

const { planSchedule } = compiled.exports;
const given = { startDate: "2026-11-23", startTime: "08:00", dayEnd: "17:00", lunchStart: "12:00", lunchEnd: "13:00" }; // a Monday

test("a few groups get the standard 45 minutes on the day the adviser picked", () => {
  const plan = planSchedule(3, given);
  assert.equal(plan.minutes, 45);
  assert.deepEqual(plan.slots.map((s) => s.date + " " + s.time), ["2026-11-23 08:00", "2026-11-23 08:45", "2026-11-23 09:30"]);
});

test("ten groups still fit in one day at 45 minutes (five before lunch, five after)", () => {
  const plan = planSchedule(10, given);
  assert.equal(plan.minutes, 45);
  assert.equal(new Set(plan.slots.map((s) => s.date)).size, 1);
  assert.equal(plan.slots[5].time, "13:00");
});

test("when 45 minutes would push a few groups to a second day, 30 minutes keeps everyone on the first day", () => {
  const plan = planSchedule(12, given);
  assert.equal(plan.minutes, 30);
  assert.equal(new Set(plan.slots.map((s) => s.date)).size, 1);
  assert.equal(plan.slots.length, 12);
});

test("too many groups for one day: 45 minutes each and the next days are chosen by the system, skipping Sunday", () => {
  const plan = planSchedule(40, { ...given, startDate: "2026-11-27" }); // a Friday
  assert.equal(plan.minutes, 45);
  const days = [...new Set(plan.slots.map((s) => s.date))];
  assert.equal(days[0], "2026-11-27");
  assert.equal(days[1], "2026-11-28"); // Saturday is a working day
  assert.equal(days[2], "2026-11-30"); // Sunday is skipped
  assert.ok(days.length >= 3);
});

test("a first day that is a Sunday starts on Monday", () => {
  assert.equal(planSchedule(2, { ...given, startDate: "2026-11-22" }).slots[0].date, "2026-11-23");
});

test("a very short working day falls back to 30 minutes, and nothing is invented when not even that fits", () => {
  assert.equal(planSchedule(2, { ...given, startTime: "08:00", dayEnd: "09:00", lunchStart: "", lunchEnd: "" }).minutes, 30);
  assert.deepEqual(planSchedule(2, { ...given, startTime: "08:00", dayEnd: "08:20", lunchStart: "", lunchEnd: "" }).slots, []);
  assert.deepEqual(planSchedule(2, { ...given, startDate: "" }).slots, []);
});
