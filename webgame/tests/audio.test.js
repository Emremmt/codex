const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const game = require("../app.js");

class FakeParam {
  constructor() { this.value = 0; }
  cancelScheduledValues() {}
  setTargetAtTime(value) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
}

class FakeNode {
  connect() { return this; }
  disconnect() {}
}

class FakeOscillator extends FakeNode {
  constructor() {
    super();
    this.frequency = new FakeParam();
    this.type = "sine";
    this.onended = null;
  }
  start() {}
  stop() {}
}

class FakeGain extends FakeNode {
  constructor() {
    super();
    this.gain = new FakeParam();
  }
}

class FakeFilter extends FakeNode {
  constructor() {
    super();
    this.frequency = new FakeParam();
    this.Q = new FakeParam();
  }
}

class FakeAudioContext {
  constructor() {
    this.state = "suspended";
    this.currentTime = 1;
    this.destination = new FakeNode();
  }
  createGain() { return new FakeGain(); }
  createBiquadFilter() { return new FakeFilter(); }
  createOscillator() { return new FakeOscillator(); }
  async resume() { this.state = "running"; }
  async suspend() { this.state = "suspended"; }
}

test("audio preferences use safe defaults and bounded volume", () => {
  assert.deepEqual(game.normalizeAudioSettings(), { music: true, volume: 0.32 });
  assert.deepEqual(game.normalizeAudioSettings({ music: false, volume: -5 }), { music: false, volume: 0.05 });
  assert.deepEqual(game.normalizeAudioSettings({ music: true, volume: 4 }), { music: true, volume: 0.7 });
  assert.deepEqual(game.normalizeAudioSettings({ volume: "invalid" }), { music: true, volume: 0.32 });
});

test("procedural audio activates only after an explicit toggle and can be stopped", async () => {
  const originalWindow = global.window;
  global.window = { AudioContext: FakeAudioContext };
  try {
    assert.equal(await game.toggleAudio(), true);
    assert.equal(game.playEffect("victory"), true);
    assert.equal(game.toggleMusic(), false);
    assert.equal(game.toggleMusic(), true);
    assert.equal(game.setAudioVolume(2), 0.7);
    assert.equal(await game.toggleAudio(), false);
    assert.equal(game.playEffect("click"), false);
  } finally {
    global.window = originalWindow;
  }
});

test("iPhone audio controls and LAN-safe IDs are present without media downloads", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

  assert.match(html, /id="audioToggle"/);
  assert.match(html, /id="musicToggle"/);
  assert.match(html, /id="volumeControl"[^>]*type="range"/);
  assert.match(js, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(js, /setInterval\(playMusicStep, 1_800\)/);
  assert.match(js, /visibilitychange/);
  assert.match(css, /\.audio-controls[\s\S]*min-height: 44px/);
  assert.doesNotMatch(js, /\.(mp3|wav|ogg|m4a)/i);
  assert.doesNotMatch(js, /crypto\.randomUUID\(/);

  const ids = new Set(Array.from({ length: 500 }, () => game.makeId()));
  assert.equal(ids.size, 500);
  assert.ok([...ids].every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)));
  assert.match(game.makeId(null), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
