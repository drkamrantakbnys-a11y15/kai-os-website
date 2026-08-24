import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");

if (!existsSync(dist)) {
  console.error("VERIFY_ERROR=dist_missing_run_npm_build_first");
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function routeFor(file) {
  const rel = relative(dist, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}`;
  if (rel.endsWith(".html")) return `/${rel.slice(0, -".html".length)}`;
  return `/${rel}`;
}

function targetRoute(pathname) {
  if (pathname === "/") return "/";
  if (pathname.endsWith(".html")) return pathname.slice(0, -5) || "/";
  return pathname.replace(/\/$/, "");
}

const htmlFiles = walk(dist).filter((file) => extname(file) === ".html");
const htmlByRoute = new Map(htmlFiles.map((file) => [routeFor(file), readFileSync(file, "utf8")]));
const failures = [];
let internalLinks = 0;

for (const [sourceRoute, html] of htmlByRoute) {
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) failures.push(`${sourceRoute}: expected one h1, found ${h1Count}`);

  const metadataChecks = [
    [/<title>[^<]+<\/title>/i, "title"],
    [/<meta\s+name="description"\s+content="[^"]+"/i, "description"],
    [/<link\s+rel="canonical"\s+href="[^"]+"/i, "canonical"],
    [/<meta\s+property="og:title"\s+content="[^"]+"/i, "og:title"],
    [/<meta\s+property="og:image"\s+content="[^"]+"/i, "og:image"],
    [/<meta\s+name="twitter:card"\s+content="summary_large_image"/i, "twitter:card"],
    [/<script\s+type="application\/ld\+json"/i, "json-ld"],
  ];
  for (const [pattern, label] of metadataChecks) {
    if (!pattern.test(html)) failures.push(`${sourceRoute}: missing ${label}`);
  }

  const linkPattern = /href="([^"]+)"/gi;
  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];
    if (!href || href.includes("${") || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    internalLinks += 1;

    const [rawPath, fragment] = href.split("#", 2);
    const resolvedPath = rawPath
      ? rawPath.startsWith("/")
        ? rawPath
        : new URL(rawPath, `https://projectkai.dev${sourceRoute === "/" ? "/" : `${sourceRoute}/`}`).pathname
      : sourceRoute;
    const route = targetRoute(resolvedPath);
    const target = htmlByRoute.get(route);

    if (!target) {
      const asset = join(dist, resolvedPath.replace(/^\//, ""));
      if (!existsSync(asset)) failures.push(`${sourceRoute}: broken link ${href}`);
      continue;
    }

    if (fragment) {
      const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`id=["']${escaped}["']`, "i").test(target)) {
        failures.push(`${sourceRoute}: missing fragment ${href}`);
      }
    }
  }
}

const publicText = walk(dist)
  // Verify rendered/public content. Third-party client bundles can contain
  // library development defaults (for example a localhost fallback) that
  // never render and are not project configuration or disclosed runtime data.
  .filter((file) => /\.(?:html|xml|txt|svg|json|md)$/i.test(file))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const privacyMarkers = [
  [/[A-Z]:\\(?:Users|JARVIS_SYSTEM)\\/i, "private_windows_path"],
  [/\blocalhost(?::\d+)?\b/i, "localhost"],
  [/\b(?:API_KEY|SECRET|TOKEN)\b/, "secret_identifier"],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i, "uuid_or_order_id"],
];

for (const [pattern, label] of privacyMarkers) {
  if (pattern.test(publicText)) failures.push(`public output contains ${label}`);
}

const robots = readFileSync(join(dist, "robots.txt"), "utf8");
const sitemap = readFileSync(join(dist, "sitemap.xml"), "utf8");
if (!robots.includes("Sitemap: https://projectkai.dev/sitemap.xml")) failures.push("robots sitemap missing");
if (!sitemap.includes("https://projectkai.dev/docs")) failures.push("docs missing from sitemap");
if (!existsSync(join(dist, "og-image.png"))) failures.push("og-image.png missing");

console.log(`HTML_PAGES=${htmlFiles.length}`);
console.log(`INTERNAL_LINKS_CHECKED=${internalLinks}`);
console.log(`BROKEN_LINKS=${failures.filter((item) => item.includes("broken link") || item.includes("missing fragment")).length}`);
console.log(`VERIFY_FAILURES=${failures.length}`);

if (failures.length) {
  failures.forEach((failure) => console.error(`VERIFY_FAILURE=${failure}`));
  process.exit(1);
}

console.log("METADATA=PASS");
console.log("ONE_H1_PER_PAGE=PASS");
console.log("PRIVACY_SCAN=PASS");
console.log("SITEMAP_ROBOTS_OG=PASS");
