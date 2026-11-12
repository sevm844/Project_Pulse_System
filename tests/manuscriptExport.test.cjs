/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const compiled = { exports: {} };
new Function("module", "exports", ts.transpileModule(fs.readFileSync("src/app/_lib/manuscriptExport/model.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(compiled, compiled.exports);
const { blocksFromDocument, headingsOf, placeCells, pictureSources, plainText, CONTENT_WIDTH } = compiled.exports;

const t = (text, marks) => ({ type: "text", text, ...(marks ? { marks } : {}) });
const p = (content, attrs) => ({ type: "paragraph", ...(attrs ? { attrs } : {}), content });
const doc = (...content) => ({ type: "doc", content });
const blocks = (d, sizes = new Map()) => blocksFromDocument(d, sizes);

test("marks become run formatting, and hard breaks stay", () => {
  const [para] = blocks(doc(p([
    t("plain "),
    t("bold", [{ type: "bold" }]),
    t(" "),
    t("big red", [{ type: "textStyle", attrs: { fontFamily: '"Times New Roman", serif', fontSize: "14pt", color: "#cc0000" } }]),
    { type: "hardBreak" },
    t("link", [{ type: "link", attrs: { href: "https://example.com" } }]),
    t("x", [{ type: "superscript" }]),
    t("marked", [{ type: "highlight", attrs: { color: "#ffff00" } }]),
  ])));
  const by = (text) => para.runs.find((r) => r.text === text);
  assert.equal(by("bold").bold, true);
  assert.deepEqual([by("big red").font, by("big red").size, by("big red").color], ["Times New Roman", 14, "#cc0000"]);
  assert.equal(by("\n").text, "\n");
  assert.equal(by("link").href, "https://example.com");
  assert.equal(by("x").sup, true);
  assert.equal(by("marked").highlight, "#ffff00");
  assert.equal(plainText(para), "plain bold big red linkxmarked");
});

test("paragraph spacing, alignment and first-line indent are read in Word's terms", () => {
  const [a, b, c] = blocks(doc(
    p([t("default")]),
    p([t("set")], { textAlign: "justify", lineHeight: "2", textIndent: "0.5in" }),
    p([t("bad values")], { textAlign: "sideways", lineHeight: "99", textIndent: "wide" }),
  ));
  assert.deepEqual([a.lineHeight, a.indent, a.align], [1.5, 0, undefined]);
  assert.deepEqual([b.lineHeight, b.indent, b.align], [2, 36, "justify"]);
  assert.deepEqual([c.lineHeight, c.indent, c.align], [1.5, 0, undefined]);
});

test("headings keep their level; a chapter title is centred; the contents come from them in order", () => {
  const d = doc(
    { type: "heading", attrs: { level: 1 }, content: [t("CHAPTER I")] },
    p([t("body")]),
    { type: "heading", attrs: { level: 2 }, content: [t("Background")] },
    { type: "heading", attrs: { level: 3 }, content: [t("  ")] }, // empty heading: not in the contents
    { type: "heading", attrs: { level: 3 }, content: [t("Detail")] },
  );
  const b = blocks(d);
  assert.equal(b[0].align, "center");
  assert.deepEqual(headingsOf(b), [{ level: 1, text: "CHAPTER I" }, { level: 2, text: "Background" }, { level: 3, text: "Detail" }]);
});

test("lists, quotes, code and page breaks keep their shape", () => {
  const li = (...c) => ({ type: "listItem", content: c });
  const [list, ordered, quote, code, brk] = blocks(doc(
    { type: "bulletList", content: [li(p([t("a")])), li(p([t("b")]), { type: "bulletList", content: [li(p([t("nested")]))] })] },
    { type: "orderedList", content: [li(p([t("one")]))] },
    { type: "blockquote", content: [p([t("said")])] },
    { type: "codeBlock", content: [t("x = 1")] },
    { type: "pageBreak" },
  ));
  assert.equal(list.ordered, false);
  assert.equal(list.items.length, 2);
  assert.equal(list.items[1][1].t, "list");
  assert.equal(ordered.ordered, true);
  assert.equal(quote.blocks[0].t, "p");
  assert.deepEqual([code.t, code.text, brk.t], ["code", "x = 1", "break"]);
});

test("a picture is scaled to the page width and to its own shape; an unreadable one is left out", () => {
  const png = "data:image/png;base64,AAAA";
  const img = (attrs) => ({ type: "image", attrs: { src: png, ...attrs } });
  const sizes = new Map([[png, { w: 1000, h: 500 }]]);
  const [wide, small, none] = blocks(doc(img({}), img({ width: 200 }), { type: "image", attrs: { src: "https://other.site/x.png" } }), sizes);
  assert.equal(wide.width, CONTENT_WIDTH);
  assert.equal(wide.height, CONTENT_WIDTH / 2);
  assert.deepEqual([small.width, small.height], [150, 75]); // 200 screen px = 150 pt
  assert.equal(none, undefined);
  assert.deepEqual(pictureSources(doc(img({}), img({}), { type: "image", attrs: { src: "https://other.site/x.png" } })), [png]);
});

test("table cells are placed on the grid with row and column spans counted", () => {
  const cell = (text, colspan = 1, rowspan = 1, type = "tableCell") => ({ type, attrs: { colspan, rowspan }, content: [p([t(text)])] });
  const row = (...cells) => ({ type: "tableRow", content: cells });
  const [table] = blocks(doc({ type: "table", content: [
    row(cell("H1", 1, 1, "tableHeader"), cell("H2", 1, 1, "tableHeader"), cell("H3", 1, 1, "tableHeader")),
    row(cell("Q", 1, 2), cell("R"), cell("D")),
    row(cell("S"), cell("P")), // the first column is taken by the row span above
    row(cell("All", 3)),
  ] }));
  const { cols, rows, placed } = placeCells(table);
  assert.deepEqual([cols, rows], [3, 4]);
  const at = (text) => placed.find((x) => x.cell.blocks[0].runs[0].text === text);
  assert.deepEqual([at("S").r, at("S").c, at("P").c], [2, 1, 2]);
  assert.deepEqual([at("All").c, at("All").cell.colSpan], [0, 3]);
  assert.equal(table.rows[0][0].header, true);
});
