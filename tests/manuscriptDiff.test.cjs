/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const compiled = { exports: {} };
new Function("module", "exports", ts.transpileModule(fs.readFileSync("src/app/_lib/manuscriptDiff.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(compiled, compiled.exports);
const { compareDocuments, diffWords, toBlocks, toSections, countWords } = compiled.exports;

const p = (text) => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] });
const h = (text, level = 1) => ({ type: "heading", attrs: { level }, content: [{ type: "text", text }] });
const doc = (...content) => ({ type: "doc", content });
const typesOf = (result) => result.rows.map((r) => r.type);

test("identical documents have no changes", () => {
  const d = doc(h("CHAPTER I"), p("One."), p("Two."));
  const r = compareDocuments(d, d);
  assert.deepEqual(typesOf(r), ["same", "same", "same"]);
  assert.deepEqual(r.stats, { changed: 0, added: 0, removed: 0, wordsAdded: 0, wordsRemoved: 0 });
});

test("formatting alone is not a change", () => {
  const plain = doc(p("The same words."));
  const bold = doc({ type: "paragraph", attrs: { textAlign: "justify" }, content: [{ type: "text", text: "The same words.", marks: [{ type: "bold" }] }] });
  assert.deepEqual(typesOf(compareDocuments(plain, bold)), ["same"]);
});

test("a rewritten sentence is one changed paragraph with the old and new words", () => {
  const a = doc(h("CHAPTER I"), p("The objectives of the study are to make a better queue system for residents."), p("Closing."));
  const b = doc(h("CHAPTER I"), p("The objectives of the study are to reduce average waiting time by 30% for residents."), p("Closing."));
  const r = compareDocuments(a, b);
  assert.deepEqual(typesOf(r), ["same", "changed", "same"]);
  const parts = r.rows[1].parts;
  assert.ok(parts.some((x) => x.t === "del" && x.text.includes("make a better queue system")));
  assert.ok(parts.some((x) => x.t === "add" && x.text.includes("reduce average waiting time")));
  assert.equal(parts[0].t, "same");
  assert.equal(r.stats.changed, 1);
  // rebuilding either side from the parts gives back the original text
  assert.equal(parts.filter((x) => x.t !== "add").map((x) => x.text).join(""), a.content[1].content[0].text);
  assert.equal(parts.filter((x) => x.t !== "del").map((x) => x.text).join(""), b.content[1].content[0].text);
});

test("added and removed paragraphs are reported with word counts", () => {
  const a = doc(p("Keep this."), p("Remove this whole paragraph entirely."), p("Tail."));
  const b = doc(p("Keep this."), p("Tail."), p("A brand new closing paragraph here."));
  const r = compareDocuments(a, b);
  assert.deepEqual(typesOf(r), ["same", "removed", "same", "added"]);
  assert.equal(r.stats.removed, 1);
  assert.equal(r.stats.added, 1);
  assert.equal(r.stats.wordsRemoved, 5);
  assert.equal(r.stats.wordsAdded, 6);
});

test("a sentence that was expanded or heavily reworded is still one edit, not a removal plus an addition", () => {
  const a = doc(
    p("The problem is that the current process is slow."),
    p("The objectives of the study are to make a better queue system for residents."),
  );
  const b = doc(
    p("The problem is that the current paper-based process takes an average of 3 hours per resident and causes missed appointments."),
    p("The objectives of the study are to reduce average waiting time at the barangay hall by at least 30% and to process 100 residents per day."),
    p("A new objective: to send SMS reminders to residents."),
  );
  assert.deepEqual(typesOf(compareDocuments(a, b)), ["changed", "changed", "added"]);
});

test("an unrelated replacement is a removal plus an addition, not a rewrite", () => {
  const r = compareDocuments(doc(p("Alpha beta gamma delta.")), doc(p("Completely different sentence now.")));
  assert.deepEqual(typesOf(r), ["removed", "added"]);
});

test("a heading is not paired with a paragraph", () => {
  const r = compareDocuments(doc(p("Introduction to the study")), doc(h("Introduction to the study")));
  assert.deepEqual(typesOf(r), ["removed", "added"]);
});

test("lists, tables and pictures become readable blocks", () => {
  const d = doc(
    { type: "bulletList", content: [{ type: "listItem", content: [p("First")] }, { type: "listItem", content: [p("Second")] }] },
    { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p("Third")] }] },
    { type: "table", content: [{ type: "tableRow", content: [{ type: "tableHeader", content: [p("Name")] }, { type: "tableHeader", content: [p("Role")] }] }] },
    { type: "image", attrs: { src: "data:image/png;base64,AAAA", alt: "Figure 1" } },
    { type: "pageBreak" },
    p(""),
  );
  const blocks = toBlocks(d);
  assert.deepEqual(blocks.map((b) => [b.kind, b.marker ?? "", b.text]), [
    ["item", "•", "First"], ["item", "•", "Second"], ["item", "3.", "Third"], ["row", "", "Name | Role"], ["image", "", "Figure 1"],
  ]);
});

test("a picture swapped for another is reported (same caption means no change)", () => {
  const img = (alt) => ({ type: "image", attrs: { src: "x", alt } });
  assert.deepEqual(typesOf(compareDocuments(doc(img("Figure 1")), doc(img("Figure 1")))), ["same"]);
  assert.deepEqual(typesOf(compareDocuments(doc(img("Figure 1")), doc(img("Figure 2")))), ["removed", "added"]);
});

test("a long paper with a few edits keeps everything else as unchanged", () => {
  const body = Array.from({ length: 1500 }, (_, i) => p(`Paragraph number ${i} talks about queue systems in barangay halls.`));
  const edited = body.slice();
  edited[200] = p("Paragraph number 200 talks about queue systems in barangay halls and now says more than before.");
  edited.splice(900, 1);
  edited.splice(1200, 0, p("A completely new paragraph inserted late."));
  const r = compareDocuments(doc(...body), doc(...edited));
  assert.equal(r.stats.changed, 1);
  assert.equal(r.stats.removed, 1);
  assert.equal(r.stats.added, 1);
  assert.equal(r.rows.filter((x) => x.type === "same").length, 1498);
  assert.equal(r.coarse, false);
});

test("a completely different huge paper does not hang", () => {
  const a = doc(...Array.from({ length: 5000 }, (_, i) => p(`Old ${i} text`)));
  const b = doc(...Array.from({ length: 5000 }, (_, i) => p(`New ${i} words`)));
  const t = Date.now();
  const r = compareDocuments(a, b);
  assert.ok(Date.now() - t < 5000);
  assert.equal(r.stats.removed + r.stats.added, 10000);
  assert.equal(r.coarse, true);
});

test("changes in a neighbouring paragraph are paired in order", () => {
  const a = doc(p("Alpha beta gamma delta epsilon."), p("One two three four five six."));
  const b = doc(p("Alpha beta gamma delta zeta."), p("One two three four five seven."));
  const r = compareDocuments(a, b);
  assert.deepEqual(typesOf(r), ["changed", "changed"]);
});

test("word diff folds lone spaces so a replaced phrase reads as one old piece and one new piece", () => {
  const parts = diffWords("we make a better system today", "we reduce waiting time today");
  assert.deepEqual(parts.map((x) => x.t), ["same", "del", "add", "same"]);
  assert.equal(parts[1].text, "make a better system");
  assert.equal(parts[2].text, "reduce waiting time");
});

test("sections fold long unchanged runs and keep one paragraph of context", () => {
  const body = Array.from({ length: 30 }, (_, i) => p(`Paragraph ${i} here.`));
  const edited = body.slice();
  edited[15] = p("Paragraph 15 was changed here for real.");
  const r = compareDocuments(doc(...body), doc(...edited));
  const folded = toSections(r.rows, true, new Set());
  assert.deepEqual(folded.map((s) => s.kind), ["folded", "same", "change", "same", "folded"]);
  assert.equal(folded.filter((s) => s.kind === "folded").reduce((n, s) => n + s.count, 0), 27);
  assert.equal(toSections(r.rows, false, new Set()).filter((s) => s.kind === "change").length, 1);
  const open = toSections(r.rows, true, new Set([folded[0].id]));
  assert.equal(open[0].kind, "same");
});

test("countWords counts words, not punctuation", () => {
  assert.equal(countWords("It's a well-known fact, isn't it?"), 6);
});
