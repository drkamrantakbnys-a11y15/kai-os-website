// Focused, framework-free test for src/lib/analytics.js's parseUtmParams()
// (CEO "YouTube -> Project KAI Attribution Foundation"). This repository
// has no test framework installed (no vitest/jest) -- rather than add one
// just for this, this is a plain Node ESM script using the built-in
// assert module, runnable with:
//
//     node tests/analytics.utm.test.mjs
//
// WHY THIS EXTRACTS RATHER THAN IMPORTS DIRECTLY: analytics.js's only
// import, "./supabase.js", reads `import.meta.env.PUBLIC_SUPABASE_URL` --
// an Astro/Vite-injected global that does not exist under plain Node
// (confirmed: `node --check` on a direct import throws
// "Cannot read properties of undefined (reading 'PUBLIC_SUPABASE_URL')"
// before this test's own code ever runs, since it fails at
// supabase.js's own module-evaluation time, not at call time). This
// repository has no Vite/Astro test harness installed to resolve that
// global safely. parseUtmParams() and its private helper
// _sanitizeUtmValue() have ZERO dependency on that import, on
// localStorage, or on the Supabase client -- they are pure functions of
// their string argument -- so this script extracts their EXACT, real
// source text (byte for byte, via a precise, hard boundary match against
// the real file -- see extractPureFunctionSource() below, which FAILS
// LOUDLY if the boundary markers ever stop matching, rather than
// silently testing stale code) and evaluates only that self-contained
// slice. This tests the real, shipped logic, not a reimplementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = path.join(__dirname, "..", "src", "lib", "analytics.js");

function extractPureFunctionSource() {
  const source = readFileSync(SOURCE_PATH, "utf-8");
  const startMarker = "const MAX_UTM_VALUE_LENGTH";
  const endMarker = "\nexport function trackPageView";
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      "extractPureFunctionSource(): boundary markers not found in analytics.js -- " +
      "the real source has changed shape; update this test's markers rather than " +
      "letting it silently test stale/disconnected code."
    );
  }
  return source.slice(startIndex, endIndex);
}

const moduleSource = extractPureFunctionSource().replace("export function parseUtmParams", "function parseUtmParams");
const factory = new Function(`${moduleSource}\nreturn { parseUtmParams };`);
const { parseUtmParams } = factory();

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log("parseUtmParams() (extracted from the real src/lib/analytics.js)");

test("captures a normal, complete UTM triple", () => {
  const result = parseUtmParams("?utm_source=youtube&utm_medium=video&utm_campaign=PK-029");
  assert.deepEqual(result, { utm_source: "youtube", utm_medium: "video", utm_campaign: "PK-029" });
});

test("handles no query string at all (normal visit, no attribution)", () => {
  assert.deepEqual(parseUtmParams(""), {});
  assert.deepEqual(parseUtmParams(null), {});
  assert.deepEqual(parseUtmParams(undefined), {});
});

test("handles a query string with unrelated parameters only", () => {
  assert.deepEqual(parseUtmParams("?foo=bar&baz=qux"), {});
});

test("captures only the UTM keys that are present, not all three required", () => {
  assert.deepEqual(parseUtmParams("?utm_source=youtube"), { utm_source: "youtube" });
});

test("rejects an oversized value (bounded length) rather than truncating it", () => {
  const oversized = "a".repeat(200);
  const result = parseUtmParams(`?utm_campaign=${oversized}`);
  assert.deepEqual(result, {});
});

test("accepts a value exactly at the length boundary", () => {
  const exactly100 = "a".repeat(100);
  const result = parseUtmParams(`?utm_campaign=${exactly100}`);
  assert.deepEqual(result, { utm_campaign: exactly100 });
});

test("rejects a value containing disallowed characters (script-injection-shaped input)", () => {
  const result = parseUtmParams("?utm_campaign=" + encodeURIComponent("<script>alert(1)</script>"));
  assert.deepEqual(result, {});
});

test("rejects an empty string value the same as a missing one", () => {
  assert.deepEqual(parseUtmParams("?utm_source="), {});
});

test("rejects a whitespace-only value", () => {
  assert.deepEqual(parseUtmParams("?utm_source=" + encodeURIComponent("   ")), {});
});

test("malformed query string never throws, degrades to no attribution", () => {
  assert.doesNotThrow(() => parseUtmParams("not a real query string %%%"));
});

test("accepts real topic_id-shaped campaign values (hyphenated slug)", () => {
  const result = parseUtmParams("?utm_campaign=PK-029");
  assert.equal(result.utm_campaign, "PK-029");
});

test("never returns a key for an unsupported query parameter", () => {
  const result = parseUtmParams("?utm_source=youtube&utm_content=something&gclid=abc123");
  assert.equal("utm_content" in result, false);
  assert.equal("gclid" in result, false);
});

// ============================================================
// UTM Database Persistence Wiring (CEO "Wire UTM Attribution Into
// Production page_view Source Code"). trackPageView() itself still can't
// be imported directly under plain Node (same supabase.js
// import.meta.env problem described above), so these tests cover the
// two things that actually changed:
//   1. structural checks on the real, unmodified analytics.js source,
//      proving the insert call now spreads the parsed utm object and
//      that nothing else about the local-capture flow moved.
//   2. composition tests using the REAL, extracted parseUtmParams()
//      to build the exact object shape trackPageView() now sends
//      (`{ path, ...utm }`), proving the payload is correct for a
//      full triple, a partial triple, no UTM params, and an invalid
//      value -- without needing to invoke trackPageView() itself.
// ============================================================

// Fail-closed network tripwire: any attempt to open a real socket during
// this test run throws immediately. Self-tested first so a silently
// broken tripwire can't produce a false "no network calls" pass.
import net from "node:net";
const realConnect = net.Socket.prototype.connect;
let tripwireArmed = false;
net.Socket.prototype.connect = function (...args) {
  if (tripwireArmed) {
    throw new Error("Network tripwire: attempted a real socket connection during offline tests.");
  }
  return realConnect.apply(this, args);
};

test("network tripwire self-test: a real connection attempt is caught", () => {
  tripwireArmed = true;
  try {
    assert.throws(() => new net.Socket().connect(80, "example.com"));
  } finally {
    tripwireArmed = false;
  }
});

tripwireArmed = true;

const fullSource = readFileSync(SOURCE_PATH, "utf-8");

test("the real page_views insert call spreads the parsed utm object", () => {
  assert.match(
    fullSource,
    /client\.from\("page_views"\)\.insert\(\{\s*path,\s*\.\.\.utm\s*\}\)/,
    "expected exactly this shape: client.from(\"page_views\").insert({ path, ...utm })"
  );
});

test("exactly one page_views insert call exists in the source (no second/duplicate write)", () => {
  const matches = fullSource.match(/\.from\("page_views"\)\.insert\(/g) || [];
  assert.equal(matches.length, 1, `expected exactly 1 page_views insert call, found ${matches.length}`);
});

test("the existing device-local UTM attribution capture block is still present, unchanged", () => {
  assert.match(
    fullSource,
    /const attributions = JSON\.parse\(localStorage\.getItem\(UTM_STORAGE_KEY\) \|\| "\[\]"\);\s*\n\s*attributions\.push\(\{ path, \.\.\.utm, created_at: new Date\(\)\.toISOString\(\) \}\);/,
    "the pre-existing local-only attribution capture (kai-utm-attribution-v1) must remain intact"
  );
});

test("insert payload composition: full UTM triple produces path + all three utm_* fields", () => {
  const utm = parseUtmParams("?utm_source=youtube&utm_medium=video&utm_campaign=PK-029");
  const payload = { path: "/news/pk-029", ...utm };
  assert.deepEqual(payload, {
    path: "/news/pk-029",
    utm_source: "youtube",
    utm_medium: "video",
    utm_campaign: "PK-029",
  });
});

test("insert payload composition: a normal visit with no UTM params sends only path", () => {
  const utm = parseUtmParams("");
  const payload = { path: "/about", ...utm };
  assert.deepEqual(payload, { path: "/about" });
  assert.equal("utm_source" in payload, false);
  assert.equal("utm_medium" in payload, false);
  assert.equal("utm_campaign" in payload, false);
});

test("insert payload composition: a partial UTM query only adds the keys that were present", () => {
  const utm = parseUtmParams("?utm_source=youtube");
  const payload = { path: "/discovery", ...utm };
  assert.deepEqual(payload, { path: "/discovery", utm_source: "youtube" });
});

test("insert payload composition: an invalid/oversized UTM value is omitted, never invented", () => {
  const utm = parseUtmParams(`?utm_campaign=${"a".repeat(200)}`);
  const payload = { path: "/learning", ...utm };
  assert.deepEqual(payload, { path: "/learning" });
});

tripwireArmed = false;
net.Socket.prototype.connect = realConnect;

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
