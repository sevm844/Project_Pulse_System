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

test("group leader comes first with actual account identity and members cannot duplicate it", () => {
  const members = api.buildSelectedGroupMembers([leader, member], "leader", ["leader", "member", "member"]);
  assert.deepEqual(members, [
    { uid: "leader", name: "Leader", email: leader.email, role: "Group Leader" },
    { uid: "member", name: "Member", email: member.email, role: "Member" },
  ]);
});

test("a missing leader or a student who is no longer available blocks invitation creation", () => {
  assert.equal(api.buildSelectedGroupMembers([leader, member], "", ["member"]), null);
  assert.equal(api.buildSelectedGroupMembers([leader], "leader", ["member"]), null);
});

test("a group is 1 to 3 students: a single student is allowed, a fourth is not", () => {
  const extra = (n) => ({ ...leader, uid: "m" + n, fullName: "M" + n, email: "m" + n + "@ub.edu.ph" });
  const pool = [leader, extra(1), extra(2), extra(3)];

  assert.equal(api.buildSelectedGroupMembers(pool, "leader", []).length, 1);
  assert.equal(api.buildSelectedGroupMembers(pool, "leader", ["m1"]).length, 2);
  assert.equal(api.buildSelectedGroupMembers(pool, "leader", ["m1", "m2"]).length, 3);
  assert.equal(api.buildSelectedGroupMembers(pool, "leader", ["m1", "m2", "m3"]), null);
  assert.equal(api.MAX_GROUP_SIZE, 3);
});
