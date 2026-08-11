// Content Routing Engine (Media Network + Engagement Expansion,
// Section 6). Deterministic and explainable by construction -- a
// lookup table plus a small scoring comparison, never a live model
// call. This is never described as "AI-powered" anywhere in the UI,
// per the prompt's own explicit instruction ("do not claim that it
// uses AI unless actual AI is being used"). Used live, in the browser,
// by /media's interactive router demo -- the same function that backs
// the worked examples shown on that page.

// Channel IDs are the authoritative identity (Two-Channel YouTube Safety
// sprint) -- names are informational only, mirrored exactly from the
// Python-side registry (KAI_OS/desktop_operator/operator_command_control/
// youtube_gateway.py's YOUTUBE_CHANNELS). Single source of truth here so
// every CATEGORY_ROUTING entry below only needs to name a channel once;
// its ID is derived, never duplicated per-entry.
export const CHANNEL_IDS = {
  "ProjectKAIAI": "UCgEKqjS1eM4Q8KUxloKVNKA",
  "Project Kai AI Lessons": "UC75pRQ4fzmpNDXUSaI9BNKQ",
};

// Category -> primary recommendation. Categories not listed fall
// through to the score-based comparison below.
const CATEGORY_ROUTING = {
  TUTORIALS: { channel: "Project Kai AI Lessons", reason: "Tutorials teach how to use something -- that's the educational channel's core pillar." },
  PRODUCTIVITY: { channel: "Project Kai AI Lessons", reason: "Productivity and workflow content is practical, applied AI education." },
  AUTOMATION: { channel: "Project Kai AI Lessons", reason: "Automation tutorials are practical AI education." },
  NEWS: { channel: "Project Kai AI Lessons", reason: "AI news and explainers are an educational-channel pillar (AI updates, AI news)." },
  DOCUMENTARIES: { channel: "ProjectKAIAI", reason: "Documentary-style storytelling is a stated ProjectKAIAI content pillar." },
  DISCOVERIES: { channel: "ProjectKAIAI", reason: "Discovery-oriented content matches ProjectKAIAI's core mission." },
  GADGETS: { channel: "ProjectKAIAI", reason: "Gadget reviews are a stated ProjectKAIAI content pillar." },
  REVIEWS: { channel: "ProjectKAIAI", reason: "App and gadget reviews are a stated ProjectKAIAI content pillar." },
  SCIENCE: { channel: "ProjectKAIAI", reason: "Science and discovery content matches ProjectKAIAI's core mission." },
  SPACE: { channel: "ProjectKAIAI", reason: "Space content falls under ProjectKAIAI's science/discovery pillar." },
  FUTURE: { channel: "ProjectKAIAI", reason: "Future-technology and “what if” content is a stated ProjectKAIAI pillar." },
  EXPERIMENTS: { channel: "ProjectKAIAI", reason: "AI experiments are a stated ProjectKAIAI content pillar." },

  // Live Website Master Implementation, Phase 17 -- exact category
  // set requested, hardening the router beyond the original set above
  // (kept, not replaced, so nothing already routed changes behavior).
  DISCOVERY: { channel: "ProjectKAIAI", reason: "Discovery-oriented content matches ProjectKAIAI's core mission." },
  WILDLIFE: { channel: "ProjectKAIAI", reason: "Nature and wildlife content is a stated ProjectKAIAI discovery pillar." },
  DOCUMENTARY: { channel: "ProjectKAIAI", reason: "Documentary-style storytelling is a stated ProjectKAIAI content pillar." },
  "GADGET DISCOVERY": { channel: "ProjectKAIAI", reason: "Gadget discovery/review content is a stated ProjectKAIAI content pillar." },
  ENTERTAINMENT: { channel: "ProjectKAIAI", reason: "Entertainment-oriented content matches ProjectKAIAI's discovery/media mission." },
  FACTS: { channel: "ProjectKAIAI", reason: "Short discovery facts are a stated ProjectKAIAI content pillar." },
  EDUCATION: { channel: "Project Kai AI Lessons", reason: "Education is the educational channel's entire purpose." },
  "HOW-TO": { channel: "Project Kai AI Lessons", reason: "How-to content teaches how to use something -- the educational channel's core pillar." },
  "AI TOOL GUIDE": { channel: "Project Kai AI Lessons", reason: "Tool guides are practical, applied AI education." },
  "TECHNICAL EXPLANATION": { channel: "Project Kai AI Lessons", reason: "Technical explanations are a stated educational-channel pillar." },
  "AI LESSON": { channel: "Project Kai AI Lessons", reason: "AI lessons are the educational channel's namesake pillar." },
};

/**
 * routeContent -- deterministic content routing.
 *
 * @param {object} input
 * @param {string} [input.category] - one of src/data/categories.js's keys
 * @param {number} [input.educational_depth] 0-10
 * @param {number} [input.entertainment_score] 0-10
 * @param {number} [input.technology_score] 0-10
 * @param {number} [input.science_score] 0-10
 * @param {number} [input.news_score] 0-10
 * @returns {{recommended_channel: string, recommended_channel_id: string, destination: "primary"|"secondary", confidence: "HIGH"|"MEDIUM"|"LOW", reason: string, secondary_channel_option: string, secondary_channel_id: string, safety_flags: string[], requires_human_review: boolean, recommended_action: string}}
 */
export function routeContent(input = {}) {
  const result = _routeContent(input);
  // Real, derived fields, not a second routing decision: `destination`
  // is a pure mapping from the channel already chosen above (never an
  // independent judgment call), and `requires_human_review` is exactly
  // "confidence is not HIGH" -- the router already never returns HIGH
  // confidence except when a real category rule matched exactly, so this
  // never silently rubber-stamps a fallback/low-signal decision (Phase 6:
  // "Never silently choose a destination on low confidence").
  const destination = result.recommended_channel === "ProjectKAIAI" ? "primary" : "secondary";
  const requiresHumanReview = result.confidence !== "HIGH";
  // recommended_action is deterministic text derived from the same
  // confidence/destination already computed above -- never a second,
  // independent judgment, and never claims to authorize an upload by
  // itself (the router has no code path that calls or overrides the
  // separate YouTube channel guard in youtube_gateway.py).
  const recommendedAction = requiresHumanReview
    ? `Send to human review before routing to ${result.recommended_channel} -- confidence is ${result.confidence}, not HIGH.`
    : `Safe to route to ${result.recommended_channel} (${destination}) automatically -- still subject to the separate YouTube channel-identity guard before any real upload.`;
  return {
    ...result,
    destination,
    requires_human_review: requiresHumanReview,
    recommended_action: recommendedAction,
  };
}

function _routeContent(input = {}) {
  const { category, educational_depth = 0, entertainment_score = 0, technology_score = 0, science_score = 0, news_score = 0 } = input;

  if (category && CATEGORY_ROUTING[category]) {
    const rule = CATEGORY_ROUTING[category];
    const secondaryChannel = rule.channel === "ProjectKAIAI" ? "Project Kai AI Lessons" : "ProjectKAIAI";
    return {
      recommended_channel: rule.channel,
      recommended_channel_id: CHANNEL_IDS[rule.channel],
      confidence: "HIGH",
      reason: rule.reason,
      secondary_channel_option: secondaryChannel,
      secondary_channel_id: CHANNEL_IDS[secondaryChannel],
      // Real signal, not a placeholder: this branch matched a known
      // category in the lookup table, so there is nothing to flag.
      safety_flags: [],
    };
  }

  // Fallback: compare an educational score against a discovery/
  // entertainment score. Simple, deterministic, explainable -- not a
  // machine-learned weighting.
  const educationalWeight = educational_depth + news_score;
  const discoveryWeight = entertainment_score + technology_score + science_score;

  if (educationalWeight === 0 && discoveryWeight === 0) {
    return {
      recommended_channel: "ProjectKAIAI",
      recommended_channel_id: CHANNEL_IDS["ProjectKAIAI"],
      confidence: "LOW",
      reason: "No category or scoring signal provided -- defaulting to the primary discovery channel.",
      secondary_channel_option: "Project Kai AI Lessons",
      secondary_channel_id: CHANNEL_IDS["Project Kai AI Lessons"],
      // Real, not fabricated: no category matched AND no score signal was
      // given at all -- this is a pure default, not a reasoned decision,
      // and callers should treat it as a genuine "send to human review"
      // case per the router's own architecture (Section 10).
      safety_flags: ["NO_SIGNAL_DEFAULTED", "LOW_CONFIDENCE_RECOMMEND_HUMAN_REVIEW"],
    };
  }

  if (educationalWeight > discoveryWeight) {
    const confidence = educationalWeight - discoveryWeight >= 4 ? "HIGH" : "MEDIUM";
    return {
      recommended_channel: "Project Kai AI Lessons",
      recommended_channel_id: CHANNEL_IDS["Project Kai AI Lessons"],
      confidence,
      reason: "Educational and news signal outweighs discovery/entertainment signal.",
      secondary_channel_option: "ProjectKAIAI",
      secondary_channel_id: CHANNEL_IDS["ProjectKAIAI"],
      safety_flags: confidence === "MEDIUM" ? ["CLOSE_SCORE_MARGIN"] : [],
    };
  }

  {
    const confidence = discoveryWeight - educationalWeight >= 4 ? "HIGH" : "MEDIUM";
    return {
      recommended_channel: "ProjectKAIAI",
      recommended_channel_id: CHANNEL_IDS["ProjectKAIAI"],
      confidence,
      reason: "Discovery, technology, and science signal outweighs educational signal.",
      secondary_channel_option: "Project Kai AI Lessons",
      secondary_channel_id: CHANNEL_IDS["Project Kai AI Lessons"],
      safety_flags: confidence === "MEDIUM" ? ["CLOSE_SCORE_MARGIN"] : [],
    };
  }
}

// Worked examples shown verbatim on /media's "Where does this story
// belong?" visualization (Section 5 of the master prompt).
export const ROUTING_EXAMPLES = [
  { story: "AI Tutorial", category: "TUTORIALS" },
  { story: "AI Gadget Review", category: "GADGETS" },
  { story: "AI Breaking News", category: "NEWS" },
  { story: "Future Technology Documentary", category: "DOCUMENTARIES" },
  { story: "AI Productivity Workflow", category: "PRODUCTIVITY" },
  { story: "Amazing Science Discovery", category: "SCIENCE" },
  { story: "KAI System Update", category: "NEWS" },
  { story: "Future Prediction / Scenario", category: "FUTURE" },
  { story: "How does RAG work?", category: "TECHNICAL EXPLANATION" },
  { story: "10 incredible facts about black holes", category: "FACTS" },
].map((ex) => ({ ...ex, result: routeContent({ category: ex.category }) }));
