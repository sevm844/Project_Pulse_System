/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const compiled = { exports: {} };
new Function("module", "exports", ts.transpileModule(fs.readFileSync("src/app/_utils/defenseWorkspace.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(compiled, compiled.exports);
const { emptyDefenseWorkspace, validateDefenseWorkspace, safeDefenseLink, getCourseDefenseId, validateDefenseSchedule } = compiled.exports;

test("schedule entries require a group, stage, date, time and venue", () => {
  const entry = { ...emptyDefenseWorkspace(), groupId: "g1", groupName: "Group One", date: "2026-10-10", time: "09:00", endTime: "09:30", venue: "Room 402" };
  assert.equal(validateDefenseSchedule(entry), "");
  for (const key of ["groupId", "groupName", "stage", "date", "time", "venue"]) {
    assert.ok(validateDefenseSchedule({ ...entry, [key]: "" }), key);
  }
  assert.ok(validateDefenseSchedule({ ...entry, endTime: "09:00" }));
  assert.ok(validateDefenseSchedule({ ...entry, endTime: "08:30" }));
  assert.equal(validateDefenseSchedule({ ...entry, endTime: "" }), "");
});

test("course publications remain separate across courses and advisers", () => {
  assert.notEqual(getCourseDefenseId("BSIT", "adviser-1"), getCourseDefenseId("BSCS", "adviser-1"));
  assert.notEqual(getCourseDefenseId("BSIT", "adviser-1"), getCourseDefenseId("BSIT", "adviser-2"));
  assert.equal(getCourseDefenseId("BSIT", "adviser-1"), getCourseDefenseId("BSIT", "adviser-1"));
  assert.ok(!getCourseDefenseId("BS/IT", "adviser/1").includes("/"));
});

test("scheduled defenses require date, time, and a nonblank venue", () => {
  const plan = { ...emptyDefenseWorkspace(), status: "Scheduled" };
  assert.ok(validateDefenseWorkspace(plan));
  assert.ok(validateDefenseWorkspace({ ...plan, date: "2026-10-10", time: "09:00", venue: " " }));
  assert.equal(validateDefenseWorkspace({ ...plan, date: "2026-10-10", time: "09:00", venue: "Room 402" }), "");
});

test("required re-defense cannot be published without its reason and schedule", () => {
  const plan = { ...emptyDefenseWorkspace(), redefenseRequired: true };
  assert.ok(validateDefenseWorkspace(plan));
  assert.equal(validateDefenseWorkspace({ ...plan, redefenseDate: "2026-10-12", redefenseTime: "10:00", redefenseVenue: "Room 403", redefenseReason: "Revise system demonstration" }), "");
});

test("shared file links reject executable and malformed URLs", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,test", "not-a-url", "file:///private"]) {
    assert.equal(safeDefenseLink(url), null);
    assert.ok(validateDefenseWorkspace({ ...emptyDefenseWorkspace(), presentationUrl: url }));
  }
  assert.equal(safeDefenseLink("https://example.com/slides"), "https://example.com/slides");
});

test("unpublished workspaces start without sample schedules or file links", () => {
  const plan = emptyDefenseWorkspace("Alpha Defense");
  assert.equal(plan.stage, "Alpha Defense");
  assert.equal(plan.date, "");
  assert.equal(plan.updatedAt, "");
  assert.equal(validateDefenseWorkspace(plan), "");
});
