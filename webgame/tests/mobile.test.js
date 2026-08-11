const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

test("iPhone safe areas and touch-sized controls are declared", () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /\.mobile-nav[\s\S]*position: fixed/);
});

test("starfield follows the viewport instead of forcing a 2K mobile canvas", () => {
  assert.doesNotMatch(js, /Math\.max\(2048/);
  assert.match(js, /devicePixelRatio/);
  assert.match(js, /compact \? 1\.35 : 1\.75/);
  assert.match(js, /compact \? 30 : 45/);
});

test("the realtime clock does not rebuild the full UI every second", () => {
  const ticker = js.match(/function realtimeTicker[\s\S]*?\n}/)?.[0] || "";
  assert.match(ticker, /if \(changed\) render\(\)/);
  assert.match(ticker, /else renderMissionPanel\(now\)/);
  assert.doesNotMatch(ticker, /\n\s*render\(\);\s*\n}/);
});

test("large galaxies cap rendered target options", () => {
  assert.match(js, /matched\.slice\(0, 80\)/);
  assert.match(html, /id="targetSearch"/);
  assert.match(html, /id="targetPreview"/);
});
