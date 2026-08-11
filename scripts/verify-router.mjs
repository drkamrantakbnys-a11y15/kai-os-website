// Real, runnable verification of the deterministic content router
// (Final Infrastructure Activation Sprint, Phase 14). Run with:
//   node scripts/verify-router.mjs
// Confirms the router is deterministic (same input -> same output,
// checked twice per case) and never "randomly" picks a channel.
import { routeContent } from "../src/data/contentRouter.js";

// Category mapping reasoning: "review" and "gadget"/"app" content
// routes to ProjectKAIAI (matches the prompt's own worked example,
// "AI Gadget Review -> ProjectKAIAI"); tutorials/guides/education
// route to Project Kai AI Lessons.
const CASES = [
  { topic: "AI tutorial", category: "TUTORIALS", expected: "Project Kai AI Lessons" },
  { topic: "AI news", category: "NEWS", expected: "Project Kai AI Lessons" },
  { topic: "AI tool review", category: "REVIEWS", expected: "ProjectKAIAI" },
  { topic: "gadget review", category: "GADGETS", expected: "ProjectKAIAI" },
  { topic: "science discovery", category: "SCIENCE", expected: "ProjectKAIAI" },
  { topic: "fun fact", category: "FACTS", expected: "ProjectKAIAI" },
  { topic: "documentary", category: "DOCUMENTARY", expected: "ProjectKAIAI" },
  { topic: "future technology", category: "FUTURE", expected: "ProjectKAIAI" },
  { topic: "app review", category: "REVIEWS", expected: "ProjectKAIAI" },
  { topic: "humorous AI content", category: "ENTERTAINMENT", expected: "ProjectKAIAI" },
  { topic: "educational AI content", category: "EDUCATION", expected: "Project Kai AI Lessons" },
];

console.log("Content Router Verification -- deterministic, rule-based, NOT an AI classifier\n");
let pass = 0;
let fail = 0;

for (const { topic, category, expected } of CASES) {
  const run1 = routeContent({ category });
  const run2 = routeContent({ category });
  const deterministic = run1.recommended_channel === run2.recommended_channel && run1.reason === run2.reason;
  const correct = run1.recommended_channel === expected;
  const status = correct && deterministic ? "PASS" : "FAIL";
  if (status === "PASS") pass++; else fail++;

  console.log(`[${status}] "${topic}" (category=${category})`);
  console.log(`  routed to: ${run1.recommended_channel} (expected: ${expected})`);
  console.log(`  confidence: ${run1.confidence} -- reason: ${run1.reason}`);
  console.log(`  deterministic across repeated calls: ${deterministic}`);
  console.log("");
}

console.log(`Result: ${pass}/${pass + fail} passed.`);
if (fail > 0) process.exitCode = 1;
