// Deterministic comment classifier (originally Live Website Master
// Implementation Phase 10; extended in the Website Intelligence +
// Media Network Activation Sprint, Phase 4). Rule-based keyword/
// pattern matching -- NOT an AI model, never described as one. This
// is the real, working part of the Comment Reply Assistant
// architecture documented in PROJECT_KAI_MEDIA_NETWORK_ARCHITECTURE.md
// section 6: it can genuinely classify a comment's likely category,
// rough sentiment, topic, and a heuristic risk score today. Generating
// an actual candidate reply is a separate step that requires a real
// LLM backend -- not implemented here, and never faked. See
// classify()'s `suggestedReply` field: always null.
//
// "toxicityScore" and "spamProbability" are explicitly heuristic
// (pattern-match density, 0-1), not the output of a trained
// classifier -- labeled as such everywhere they're displayed (see
// /admin) so nobody mistakes a keyword count for a real ML score.
//
// FLAGGED content (threats, legal accusations, medical emergencies,
// financial advice requests, harassment, hate speech) is never
// auto-anything -- it exists so the admin queue can surface these
// first for a human, never to auto-respond to them.

const CATEGORY_PATTERNS = [
  { category: "SPAM", patterns: [/\bhttps?:\/\/\S+.*https?:\/\/\S+/i, /\bfree (money|crypto|followers)\b/i, /\bclick here\b/i, /\bbuy now\b/i] },
  { category: "TROLL", patterns: [/\byou'?re (stupid|dumb|an? idiot)\b/i, /\bfake news\b/i, /\bshut up\b/i] },
  { category: "QUESTION", patterns: [/\?\s*$/, /^(how|why|what|when|where|who|which|can|does|is|are)\b/i] },
  { category: "PRAISE", patterns: [/\b(love|great|awesome|amazing|fantastic|nice|cool|thank you|thanks)\b/i] },
  { category: "CRITICISM", patterns: [/\b(wrong|bad|disagree|misleading|inaccurate|not true|doesn'?t make sense)\b/i] },
  { category: "JOKE", patterns: [/\blol\b/i, /\bhaha+\b/i, /😂|🤣/] },
  { category: "REQUEST", patterns: [/\b(please (cover|make|do|explain)|can you (cover|make|do|explain)|suggest(ion)?|request)\b/i] },
  { category: "TECHNICAL", patterns: [/\b(api|code|algorithm|architecture|implementation|error|bug|latency|token|model|dataset)\b/i] },
];

// Content that must always go to human moderation, never be
// auto-answered by anything, per the explicit safety list.
const FLAG_PATTERNS = [
  { reason: "possible threat", patterns: [/\b(kill|hurt|attack) (you|him|her|them)\b/i, /\bi will (find|hurt)\b/i] },
  { reason: "legal accusation", patterns: [/\b(lawsuit|sue|suing|legal action|defamation|copyright infringement)\b/i] },
  { reason: "medical emergency or advice request", patterns: [/\b(overdose|suicide|self.?harm|medical emergency)\b/i, /\bshould i take\b/i] },
  { reason: "financial advice request", patterns: [/\bshould i (invest|buy|sell)\b/i, /\bfinancial advice\b/i] },
  { reason: "harassment or hate speech", patterns: [/\b(hate|racist|sexist)\b.*\byou\b/i] },
];

const POSITIVE_WORDS = /\b(love|great|awesome|amazing|fantastic|nice|cool|thank(s| you)|helpful|brilliant|excellent)\b/gi;
const NEGATIVE_WORDS = /\b(wrong|bad|hate|terrible|awful|worst|disagree|misleading|inaccurate|useless|broken)\b/gi;

const TOPIC_PATTERNS = [
  { topic: "AI", patterns: [/\bai\b|artificial intelligence|machine learning|neural|llm/i] },
  { topic: "YouTube", patterns: [/\byoutube\b|\bvideo\b|\bchannel\b/i] },
  { topic: "Content Quality", patterns: [/\baccura(te|cy)|source|fact.?check|misleading/i] },
  { topic: "Technical", patterns: [/\bapi|code|bug|error|website|search|feature/i] },
];

const SPAM_INDICATORS = [/https?:\/\/\S+.*https?:\/\/\S+/i, /free (money|crypto|followers)/i, /click here/i, /buy now/i, /\bfollow me\b/i];
const TOXIC_INDICATORS = [/\bstupid|idiot|shut up|hate\b/i, /!!!+/, /[A-Z]{6,}/];

// category -> suggested reply tone (for a human moderator's benefit,
// never auto-applied).
const CATEGORY_TONE = {
  QUESTION: "Detailed", PRAISE: "Friendly", CRITICISM: "Logical", JOKE: "Humorous",
  REQUEST: "Friendly", TECHNICAL: "Technical", SPAM: "Short", TROLL: "Short", GENERAL: "Friendly",
};

function scoreMatches(text, patterns) {
  return patterns.reduce((count, p) => count + (p.test(text) ? 1 : 0), 0);
}

/**
 * classify -- deterministic, rule-based only. No network call, no
 * model, no randomness -- the same input always produces the same
 * output.
 * @param {string} body
 * @returns {{
 *   category: string, flagged: boolean, flagReason: string|null,
 *   sentiment: "POSITIVE"|"NEGATIVE"|"NEUTRAL", topic: string,
 *   toxicityScore: number, spamProbability: number,
 *   replyNeeded: boolean, suggestedTone: string, suggestedReply: null
 * }}
 */
export function classify(body) {
  const text = (body || "").trim();

  const positiveCount = (text.match(POSITIVE_WORDS) || []).length;
  const negativeCount = (text.match(NEGATIVE_WORDS) || []).length;
  const sentiment = positiveCount > negativeCount ? "POSITIVE" : negativeCount > positiveCount ? "NEGATIVE" : "NEUTRAL";

  const topicMatch = TOPIC_PATTERNS.find(({ patterns }) => patterns.some((p) => p.test(text)));
  const topic = topicMatch ? topicMatch.topic : "General";

  const toxicityScore = Math.min(1, scoreMatches(text, TOXIC_INDICATORS) / TOXIC_INDICATORS.length);
  const spamProbability = Math.min(1, scoreMatches(text, SPAM_INDICATORS) / SPAM_INDICATORS.length);

  for (const { reason, patterns } of FLAG_PATTERNS) {
    if (patterns.some((p) => p.test(text))) {
      return {
        category: "GENERAL", flagged: true, flagReason: reason,
        sentiment, topic, toxicityScore, spamProbability,
        replyNeeded: true, suggestedTone: "Logical", suggestedReply: null,
      };
    }
  }

  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((p) => p.test(text))) {
      const replyNeeded = ["QUESTION", "REQUEST", "CRITICISM", "TECHNICAL"].includes(category);
      return {
        category, flagged: false, flagReason: null,
        sentiment, topic, toxicityScore, spamProbability,
        replyNeeded, suggestedTone: CATEGORY_TONE[category] || "Friendly", suggestedReply: null,
      };
    }
  }

  return {
    category: "GENERAL", flagged: false, flagReason: null,
    sentiment, topic, toxicityScore, spamProbability,
    replyNeeded: false, suggestedTone: "Friendly", suggestedReply: null,
  };
}
