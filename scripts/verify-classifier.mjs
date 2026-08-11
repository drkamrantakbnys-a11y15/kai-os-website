// Real, runnable verification of the deterministic comment classifier
// (Final Infrastructure Activation Sprint, Phase 10). Run with:
//   node scripts/verify-classifier.mjs
// No network, no database, no LLM -- exercises src/lib/commentClassifier.js
// directly with representative inputs and prints real, actual output
// (never a fabricated expectation) so the result can be pasted straight
// into the activation report.
import { classify } from "../src/lib/commentClassifier.js";

const CASES = [
  { label: "Normal / general", text: "I watched the video about humanoid robots yesterday." },
  { label: "Positive", text: "This was awesome, thank you so much, really helpful!" },
  { label: "Negative", text: "This is wrong and misleading, I disagree with the whole thing." },
  { label: "Spam", text: "Buy now! Click here for free crypto: http://spam1.example http://spam2.example" },
  { label: "Toxic / troll", text: "You're stupid and this is fake news, shut up!!!" },
  { label: "Suspicious / flagged (threat)", text: "I will hurt you if you post this again." },
  { label: "AI-related question", text: "How does the API handle the model's context window?" },
  { label: "Humorous", text: "lol this made me laugh so hard, hahaha classic" },
];

console.log("Comment Classifier Verification -- deterministic, rule-based, NOT an LLM\n");
for (const { label, text } of CASES) {
  const result = classify(text);
  console.log(`[${label}]`);
  console.log(`  input: "${text}"`);
  console.log(`  category=${result.category} sentiment=${result.sentiment} topic=${result.topic}`);
  console.log(`  toxicityScore=${result.toxicityScore} spamProbability=${result.spamProbability}`);
  console.log(`  flagged=${result.flagged}${result.flagged ? ` (reason: ${result.flagReason})` : ""}`);
  console.log(`  replyNeeded=${result.replyNeeded} suggestedTone=${result.suggestedTone}`);
  console.log("");
}
console.log("Limitations: keyword/regex matching only -- no semantic understanding, no context across comments, easily evaded by paraphrase or misspelling. toxicityScore/spamProbability are match-density heuristics (0-1), not calibrated probabilities from a trained model.");
