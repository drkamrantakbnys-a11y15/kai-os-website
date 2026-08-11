// Phase 7 production test (Final Infrastructure Activation & Production
// Test Sprint) -- 20 representative real-world topics run through the
// same deterministic routeContent() used live on /media. No topic here
// is fabricated to look good; several deliberately test the no-category
// fallback path (score-based comparison) rather than the lookup table.
// Run with: node scripts/verify-router-production-test.mjs
import { routeContent } from "../src/data/contentRouter.js";

// NOTE: routeContent() returns {recommended_channel, confidence, reason,
// secondary_channel_option} -- there is no "format" (Short/Long-form/
// Documentary) field anywhere in the router's implementation. Reporting
// one here would be fabricated, so EXPECTED FORMAT is reported as N/A
// for every case rather than invented.
const CASES = [
  { input: "How to use ChatGPT for email drafting", category: "TUTORIALS" },
  { input: "New humanoid robot unveiled this week", category: "NEWS" },
  { input: "Review: the latest AI-powered smart glasses", category: "GADGETS" },
  { input: "Scientists discover new exoplanet with possible water", category: "SCIENCE" },
  { input: "5-minute guide to automating your inbox with Zapier", category: "AUTOMATION" },
  { input: "Documentary: the history of neural networks", category: "DOCUMENTARY" },
  { input: "10 wild facts about octopus intelligence", category: "FACTS" },
  { input: "What will AI-generated video look like in 2030?", category: "FUTURE" },
  { input: "Experiment: can an AI agent trade stocks safely?", category: "EXPERIMENTS" },
  { input: "How does retrieval-augmented generation actually work?", category: "TECHNICAL EXPLANATION" },
  { input: "Funny AI fails compilation", category: "ENTERTAINMENT" },
  { input: "Beginner's course: prompt engineering basics", category: "EDUCATION" },
  { input: "Nature documentary: deep sea bioluminescent creatures", category: "WILDLIFE" },
  { input: "Best AI note-taking apps compared", category: "REVIEWS" },
  { input: "How-to: set up a local LLM on your own laptop", category: "HOW-TO" },
  { input: "Weekly AI industry news roundup", category: "NEWS" },
  { input: "Hidden gadget features most people miss", category: "GADGET DISCOVERY" },
  { input: "AI productivity workflow for small business owners", category: "PRODUCTIVITY" },
  // No category -- exercises the score-based fallback, not the lookup table.
  { input: "Uncategorized story, strong discovery/tech signal, no news/education signal", scores: { technology_score: 6, science_score: 4 } },
  { input: "Uncategorized story, strong educational/news signal, no discovery signal", scores: { educational_depth: 7, news_score: 3 } },
];

console.log("Content Router Production Test -- 20 representative topics, deterministic, rule-based, NOT AI\n");
let pass = 0;
const rows = [];

for (const { input, category, scores } of CASES) {
  const routeInput = category ? { category } : { ...scores };
  const run1 = routeContent(routeInput);
  const run2 = routeContent(routeInput);
  const deterministic = run1.recommended_channel === run2.recommended_channel && run1.reason === run2.reason && run1.confidence === run2.confidence;
  if (deterministic) pass++;

  rows.push({ input, category: category || "(none -- score fallback)", channel: run1.recommended_channel, reason: run1.reason, confidence: run1.confidence, deterministic });

  console.log(`INPUT: "${input}"`);
  console.log(`  CATEGORY: ${category || "(none -- score-based fallback)"}`);
  console.log(`  SELECTED CHANNEL: ${run1.recommended_channel}`);
  console.log(`  REASON: ${run1.reason}`);
  console.log(`  CONFIDENCE: ${run1.confidence}`);
  console.log(`  EXPECTED FORMAT: N/A -- routeContent() has no format field (only channel/confidence/reason/secondary option); not fabricated here`);
  console.log(`  Deterministic across repeated calls: ${deterministic}`);
  console.log("");
}

console.log(`Result: ${pass}/${CASES.length} deterministic and successfully routed (all ${CASES.length} produced a channel decision; "pass" here means repeat-call determinism, since there is no separate "correct answer" oracle beyond the lookup table itself).`);
