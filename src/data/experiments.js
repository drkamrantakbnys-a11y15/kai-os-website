// Experiments seed set (Media Network + Engagement Expansion, Section
// 15). Every entry is PROPOSED -- none of these has actually been run
// yet, so none claims a result. When an experiment is actually
// performed, its `status` and `result`/`whatWeLearned`/`limitations`
// fields should be updated to reflect the real outcome, never
// pre-filled with an invented one.

export const EXPERIMENT_CATEGORIES = [
  "AI Experiments", "Prompt Experiments", "Automation Experiments",
  "Human vs AI Experiments", "AI Image Experiments", "AI Writing Experiments",
  "AI Productivity Experiments", "AI Agent Experiments",
];

export const EXPERIMENTS = [
  {
    id: "EXP-001",
    category: "Human vs AI Experiments",
    status: "PROPOSED",
    title: "Can a viewer tell which video thumbnail was AI-selected vs. human-selected?",
    question: "Does Project KAI's automated thumbnail-ranking system pick thumbnails a human audience actually prefers?",
    hypothesis: "Automated ranking will perform comparably to, but not better than, a human editor's final pick -- since the pipeline's own Thumbnail Agent explicitly routes final selection to human review today (see /agents).",
    method: "Show paired thumbnail candidates (auto-ranked top pick vs. human-selected pick) to a small panel and record preference, without revealing which is which.",
    result: "Not yet run.",
    whatWeLearned: "Nothing yet -- this experiment has not been performed.",
    limitations: "Proposed only. No panel has been recruited and no data has been collected.",
  },
  {
    id: "EXP-002",
    category: "AI Writing Experiments",
    status: "PROPOSED",
    title: "Does a shorter video script hook improve retention more than a longer one?",
    question: "Within Project KAI's real production pipeline, does hook length correlate with viewer retention?",
    hypothesis: "Shorter hooks (under 10 seconds) will show higher early retention, based on general short-form video convention -- untested against KAI's own real data so far.",
    method: "Once real YouTube Analytics access is authorized (currently NOT_CONNECTED -- see /analytics), compare retention curves for videos grouped by hook length.",
    result: "Not yet run -- blocked on Analytics Agent activation.",
    whatWeLearned: "Nothing yet -- this experiment has not been performed.",
    limitations: "Requires real analytics access that doesn't exist yet; cannot be run today.",
  },
  {
    id: "EXP-003",
    category: "AI Agent Experiments",
    status: "PROPOSED",
    title: "How often does a proposed Developer Agent change require human correction?",
    question: "If the currently-PLANNED Developer Agent (see /agents) proposed code changes for human review, how often would a human need to correct rather than simply approve them?",
    hypothesis: "Early proposals will need frequent correction, improving over time as the agent's lesson-lookup (developer_memory/) accumulates more real decisions.",
    method: "Track approve/correct/reject rates once the Developer Agent exists and is run in its designed sandbox-test-benchmark-approve loop.",
    result: "Not yet run -- the Developer Agent itself does not exist yet.",
    whatWeLearned: "Nothing yet -- this experiment has not been performed.",
    limitations: "Fully blocked on an unbuilt agent; listed here to make the eventual evaluation plan explicit in advance.",
  },
  {
    id: "EXP-004",
    category: "AI Image Experiments",
    status: "PROPOSED",
    title: "Does avoiding duplicate visual backgrounds actually reduce viewer drop-off?",
    question: "Project KAI's Visual Agent already checks every scene against prior videos for duplicate backgrounds (see /agents) -- does this measurably help retention, or is it invisible to viewers?",
    hypothesis: "The effect is small per-video but compounds across a channel's catalog as repeat viewers accumulate exposure.",
    method: "Compare retention on videos with zero duplicate-flagged scenes vs. videos where a duplicate was allowed through, once real analytics access exists.",
    result: "Not yet run -- blocked on Analytics Agent activation.",
    whatWeLearned: "Nothing yet -- this experiment has not been performed.",
    limitations: "Requires real analytics access that doesn't exist yet.",
  },
  {
    id: "EXP-005",
    category: "Automation Experiments",
    status: "PROPOSED",
    title: "Would automatic ledger writes catch more real lessons than manual ones?",
    question: "The developer_memory/ ledger is real and actively used, but written manually today (see /agents' Memory Agent entry). Would automating writes as a side effect of other agents' actions capture more, not just faster?",
    hypothesis: "Automated writes would increase volume but might reduce signal quality without a human filter deciding what's actually worth recording.",
    method: "Once other agents exist to trigger automatic writes, compare a sample against manually-curated entries for the same time period for redundancy and usefulness.",
    result: "Not yet run -- depends on other unbuilt agents.",
    whatWeLearned: "Nothing yet -- this experiment has not been performed.",
    limitations: "Blocked on multiple other PLANNED agents existing first.",
  },
  {
    id: "EXP-006",
    category: "Prompt Experiments",
    status: "PROPOSED",
    title: "Does asking KAI's (future) Comment Assistant for 'shorter' vs 'more detailed' actually change reply quality?",
    question: "Once a Comment Assistant exists (see PROJECT_KAI_MEDIA_NETWORK_ARCHITECTURE.md's design-only architecture), do its stated reply-tone modes produce meaningfully different, still-accurate replies?",
    hypothesis: "Tone modes will change length and phrasing reliably but should not change factual content -- a real risk worth testing before ever allowing auto-suggested replies near production comments.",
    method: "Once built, generate replies to a fixed comment set across all six tone modes and have a human reviewer check factual consistency across all six.",
    result: "Not yet run -- the Comment Assistant does not exist yet.",
    limitations: "Fully blocked on an unbuilt system; listed to make the safety-testing plan explicit before that system is ever built.",
  },
];
