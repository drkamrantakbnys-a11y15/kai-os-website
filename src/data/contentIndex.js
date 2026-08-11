// Unified content index (originally Media Network + Engagement
// Expansion Sections 24, 21-22, 47, 52; extended in the Website
// Intelligence + Media Network Activation Sprint, Phase 10). One flat,
// derived array built from the site's real data files -- never a
// second hand-maintained list that could drift out of sync. Powers
// Search, "Surprise Me", "What Should I Explore", "Next Discovery",
// and "KAI Daily Discovery". Anchor hrefs (#fact-001 etc.) rely on
// matching `id={...}` attributes added to each card.
//
// `channel` is computed via the real deterministic content router
// (contentRouter.js) -- never a second, independent routing decision.
// `date` is pulled from whichever real date field a content type
// actually has (publicationDate, lastUpdated, verifiedDate); types
// with no real date field get `date: null` rather than a fabricated
// one, and Search's "Newest" sort skips null-dated items rather than
// treating them as maximally old or new.

import { FACTS } from "./facts.js";
import { JOKES } from "./jokes.js";
import { NEWS } from "./news.js";
import { FUTURE_RADAR } from "./futureRadar.js";
import { DISCOVERIES } from "./discoveries.js";
import { EXPERIMENTS } from "./experiments.js";
import { REVIEWS } from "./reviews.js";
import { LEARNING_PATHS } from "./learningPaths.js";
import { routeContent } from "./contentRouter.js";

// Content type -> the router's own category vocabulary (Phase 9).
// Kept as a single small lookup so this file is the only place a
// "type" is translated into a routing decision -- never duplicated.
const TYPE_TO_ROUTER_CATEGORY = {
  Fact: "FACTS",
  Joke: "ENTERTAINMENT",
  News: "NEWS",
  "Future Radar": "FUTURE",
  Discovery: "DISCOVERY",
  Documentary: "DOCUMENTARY",
  Experiment: "EXPERIMENTS",
  "Learning Path": "EDUCATION",
  Review: "REVIEWS",
};

function channelFor(type) {
  const category = TYPE_TO_ROUTER_CATEGORY[type];
  return routeContent({ category }).recommended_channel;
}

function buildIndex() {
  const items = [];

  for (const f of FACTS) {
    items.push({
      id: f.id, type: "Fact", title: f.fact.length > 90 ? f.fact.slice(0, 87) + "..." : f.fact,
      category: f.category, href: `/fun-facts#${f.id}`, status: "Operational",
      tags: ["facts", "learn", f.category.toLowerCase()],
      channel: channelFor("Fact"), date: f.verifiedDate || null,
    });
  }

  for (const j of JOKES) {
    items.push({
      id: j.id, type: "Joke", title: j.setup,
      category: j.category, href: `/ai-jokes#${j.id}`, status: "Operational",
      tags: ["jokes", "funny", j.category.toLowerCase()],
      channel: channelFor("Joke"), date: null,
    });
  }

  for (const n of NEWS) {
    items.push({
      id: n.id, type: "News", title: n.title,
      category: n.category, href: `/ai-news#${n.id}`, status: n.status,
      tags: ["news", n.category.toLowerCase()],
      channel: channelFor("News"), date: n.publicationDate || null,
    });
  }

  for (const r of FUTURE_RADAR) {
    items.push({
      id: r.id, type: "Future Radar", title: r.title,
      category: r.category, href: `/future-radar#${r.id}`, status: "Development",
      tags: ["future", "radar", r.category.toLowerCase()],
      channel: channelFor("Future Radar"), date: r.lastUpdated || null,
    });
  }

  for (const d of DISCOVERIES) {
    const type = d.format === "documentary" ? "Documentary" : "Discovery";
    items.push({
      id: d.id, type, title: d.title,
      category: d.theme, href: `/discover#${d.id}`, status: "Operational",
      tags: ["discover", d.format, d.theme.toLowerCase()],
      channel: channelFor(type), date: null,
    });
  }

  for (const e of EXPERIMENTS) {
    items.push({
      id: e.id, type: "Experiment", title: e.title,
      category: e.category, href: `/experiments#${e.id}`, status: e.status,
      tags: ["experiments", e.category.toLowerCase()],
      channel: channelFor("Experiment"), date: null,
    });
  }

  for (const lp of LEARNING_PATHS) {
    items.push({
      id: lp.id, type: "Learning Path", title: lp.title,
      category: lp.audience, href: `/learn#${lp.id}`, status: "Development",
      tags: ["learn", "tutorials", "ai"],
      channel: channelFor("Learning Path"), date: null,
    });
  }

  for (const rv of REVIEWS) {
    items.push({
      id: rv.id, type: "Review", title: rv.name,
      category: rv.category, href: `/reviews#${rv.id}`, status: rv.status,
      tags: ["reviews", rv.category.toLowerCase()],
      channel: channelFor("Review"), date: null,
    });
  }

  return items;
}

export const CONTENT_INDEX = buildIndex();

export function searchContent(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return CONTENT_INDEX.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.type.toLowerCase().includes(q) ||
    item.tags.some((t) => t.includes(q))
  );
}

// Deterministic "KAI Daily Discovery" -- a function of the calendar
// date, not a random pick per page load and not "live curation".
export function getDailyDiscovery(date = new Date()) {
  const dayKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  const index = hash % CONTENT_INDEX.length;
  return CONTENT_INDEX[index];
}

// "What Should I Explore" intent -> tag mapping (Section 22).
export const EXPLORE_INTENTS = [
  { label: "I want to learn", tags: ["learn", "tutorials", "tuto"] },
  { label: "I want to be amazed", tags: ["discover", "documentary"] },
  { label: "I want something funny", tags: ["jokes", "funny"] },
  { label: "I want future technology", tags: ["future", "radar"] },
  { label: "I want AI", tags: ["ai"] },
  { label: "I want science", tags: ["science"] },
  { label: "I want gadgets", tags: ["gadgets", "reviews"] },
  { label: "I want something short", tags: ["facts", "jokes"] },
  { label: "I want a deep dive", tags: ["documentary", "future"] },
];

export function exploreByIntent(label) {
  const intent = EXPLORE_INTENTS.find((i) => i.label === label);
  if (!intent) return [];
  return CONTENT_INDEX.filter((item) => item.tags.some((t) => intent.tags.includes(t)));
}
