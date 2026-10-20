/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const compiled = { exports: {} };
new Function("module", "exports", ts.transpileModule(fs.readFileSync("src/app/_utils/studentSelection.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(compiled, compiled.exports);
const api = compiled.exports;
const leader = { uid: "leader", fullName: "Leader", email: "leader@ub.edu.ph", role: "Student", status: "Active" };
const member = { ...leader, uid: "member", fullName: "Member", email: "member@ub.edu.ph" };

test("dropdown uses active student accounts and removes duplicate emails", () => {
  const students = [leader, member, { ...leader, uid: "duplicate", email: " LEADER@UB.EDU.PH " }, { ...leader, uid: "staff", email: "staff@example.com", role: "Adviser" }, { ...leader, uid: "pending", email: "pending@example.com", status: "Pending" }];
  assert.deepEqual(api.getAvailableStudents(students, [], "2026-2027", "1st Semester"), [leader, member]);
});

test("existing invitations reserve students only in the matching academic period", () => {
  const group = { schoolYear: "2026-2027", semester: "1st Semester", members: [{ email: leader.email }] };
  assert.deepEqual(api.getAvailableStudents([leader, member], [group], "2026-2027", "1st Semester"), [member]);
  assert.equal(api.getAvailableStudents([leader, member], [group], "2026-2027", "2nd Semester").length, 2);
});

test("group leader comes first with actual account identity and members cannot duplicate it", () => {
  const members = api.buildSelectedGroupMembers([leader, member], "leader", ["leader", "member", "member"]);
  assert.deepEqual(members, [
    { uid: "leader", name: "Leader", email: leader.email, role: "Group Leader" },
    { uid: "member", name: "Member", email: member.email, role: "Member" },
  ]);
});

test("missing leader, missing members, and students no longer available block invitation creation", () => {
  assert.equal(api.buildSelectedGroupMembers([leader, member], "", ["member"]), null);
  assert.equal(api.buildSelectedGroupMembers([leader, member], "leader", []), null);
  assert.equal(api.buildSelectedGroupMembers([leader], "leader", ["member"]), null);
});
