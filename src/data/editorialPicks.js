// KAI Editorial Picks (Live Website Master Implementation, Phase 3).
//
// A small, explicit, hand-curated list -- never derived from fake
// "trending" metrics. No views, likes, or social counts exist behind
// this list; each entry is a human editorial judgment call, labeled
// as exactly that everywhere it's shown ("KAI Editorial Pick", never
// "Trending" or "Popular"). References real IDs from the underlying
// data files (news.js, futureRadar.js, discoveries.js, experiments.js,
// reviews.js, facts.js, jokes.js) -- resolved against contentIndex.js
// at render time so titles/links never drift out of sync.

export const EDITORIAL_PICKS = [
  { id: "NEWS-001", reason: "The clearest sign yet that AI labs are becoming chip companies -- worth understanding before the next wave of announcements." },
  { id: "FUTURE-001", reason: "Humanoid robots moved from lab demo to paid commercial work this year -- the single fastest-moving item on the radar." },
  { id: "DISC-008", reason: "Ties three real, sourced stories together into one clear picture of the AI chip race." },
  { id: "fact-007", reason: "The one architectural idea underneath almost every modern AI model -- good starting point if you only read one fact." },
  { id: "EXP-001", reason: "A proposed experiment that gets at a real, unresolved question about Project KAI's own production pipeline." },
];

export function getEditorialPickIds() {
  return new Set(EDITORIAL_PICKS.map((p) => p.id));
}

export function getEditorialReason(id) {
  return EDITORIAL_PICKS.find((p) => p.id === id)?.reason;
}
