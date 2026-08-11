// AI News Center curated seed set (Media Network + Engagement
// Expansion, Section 10). Every item below is a real, independently
// verifiable news event with a real source URL, checked via live web
// search on 2026-08-10 -- never invented. This is a CURATED snapshot,
// not a live feed: there is no Research/News Agent running yet (see
// /agents and PROJECT_KAI_MEDIA_NETWORK_ARCHITECTURE.md), so this list
// will not update itself. "KAI Take" sections are explicitly labeled
// editorial opinion, not fact.
//
// status: "RECENT" (happened within the last ~2 weeks of curation),
// "ARCHIVED" (older but still relevant context), or
// "AWAITING_RESEARCH_AGENT" (used as a placeholder state on the page
// itself, not on individual items -- see /ai-news).
//
// Three-tier honesty (Website Intelligence + Media Network Activation
// Sprint, Phase 5): `summary` is always VERIFIED FACT (sourced,
// checked); `kaiTake` is always KAI ANALYSIS (labeled editorial
// opinion in the UI). A third tier, KAI FORECAST, is supported by
// ai-news.astro via an optional `kaiForecast` field on any item, but
// none of the 5 items below are forecasts -- they're all reporting on
// events that already happened -- so none sets it. Forward-looking
// speculation belongs on /future-radar, which already has its own
// KAI Estimate labeling; this field exists so a genuinely
// forward-looking news item (e.g. "X just announced Y, which could
// mean Z") has an honest place to put the "could mean Z" part without
// it bleeding into the VERIFIED FACT summary.

export const NEWS_CATEGORIES = [
  "Model Releases", "Chips & Infrastructure", "Regulation", "Robotics", "Research",
];

export const NEWS = [
  {
    id: "NEWS-001",
    title: "Anthropic builds an in-house chip team for Claude models",
    summary: "Anthropic publicly confirmed it is assembling an internal chip-design team for its Claude models, hiring senior chip engineers, while also exploring a collaboration with Samsung on a custom chip.",
    source: "Forbes / TechCrunch",
    sourceUrl: "https://www.forbes.com/sites/jonmarkman/2026/08/06/anthropic-enters-the-ai-chip-race-with-in-house-chip-team/",
    publicationDate: "2026-08-06",
    category: "Chips & Infrastructure",
    importance: "HIGH",
    kaiTake: "Every major AI lab is now also a chip company. That says as much about the cost of serving models at scale as it does about ambition.",
    whyItMatters: "Custom silicon reduces a lab's dependence on any single external chip vendor and directly targets the cost of serving frontier models.",
    whatChanges: "Anthropic gains a long-term path to controlling its own hardware roadmap, at the cost of years of chip-design lead time before any benefit lands.",
    relatedTopics: ["AI chips", "Anthropic", "infrastructure"],
    status: "RECENT",
    sourceQuality: "REPUTABLE_SECONDARY",
  },
  {
    id: "NEWS-002",
    title: "Nvidia says Anthropic, OpenAI, and SpaceX are early users of its new Vera CPU",
    summary: "Nvidia confirmed that Anthropic, OpenAI, and SpaceX are among the first large users of its upcoming Vera central processing units, part of its next-generation AI infrastructure push.",
    source: "Bloomberg",
    sourceUrl: "https://www.bloomberg.com/news/articles/2026-06-01/nvidia-says-anthropic-openai-among-big-users-of-new-vera-chip",
    publicationDate: "2026-06-01",
    category: "Chips & Infrastructure",
    importance: "MEDIUM",
    kaiTake: "Worth watching whether this reduces the labs' dependence on Nvidia GPUs specifically, or just adds another Nvidia product line to the stack.",
    whyItMatters: "Vera is Nvidia's next-generation CPU line -- early adoption by Anthropic, OpenAI, and SpaceX signals where large-scale AI infrastructure spend is heading next.",
    whatChanges: "Nothing changes for end users yet -- this is infrastructure procurement, months to years before it's visible in any product.",
    relatedTopics: ["Nvidia", "AI infrastructure", "OpenAI"],
    status: "ARCHIVED",
    sourceQuality: "PRIMARY_SOURCE",
  },
  {
    id: "NEWS-003",
    title: "EU begins enforcing the AI Act, with some high-risk obligations delayed to December 2027",
    summary: "From August 2, 2026, the European Commission's AI Office began enforcing the EU AI Act's transparency requirements, while lawmakers postponed the most far-reaching high-risk-system obligations (biometrics, employment, education) to December 2, 2027 under the Digital Omnibus package.",
    source: "European Commission / Euronews",
    sourceUrl: "https://ec.europa.eu/commission/presscorner/detail/en/ip_26_1714",
    publicationDate: "2026-08-02",
    category: "Regulation",
    importance: "HIGH",
    kaiTake: "A delay isn't a retreat -- transparency rules are already live. The compliance clock is running even where enforcement is postponed.",
    whyItMatters: "This is the first real enforcement milestone for the world's most comprehensive AI regulation, setting precedent other jurisdictions may follow.",
    whatChanges: "AI systems operating in the EU now face live transparency obligations; the toughest high-risk-system rules are delayed, not cancelled.",
    relatedTopics: ["EU AI Act", "regulation", "compliance"],
    status: "RECENT",
    sourceQuality: "OFFICIAL_SOURCE",
  },
  {
    id: "NEWS-004",
    title: "Tesla's Optimus Gen 3 enters low-volume production; Figure AI already in paid commercial deployment",
    summary: "Tesla's Optimus V3 began low-volume production at its Fremont factory in summer 2026, working internal factory tasks. Independent trackers note Figure AI's Figure 02 completed an eleven-month BMW Spartanburg pilot and already has paying external customers -- ahead of Tesla on verified commercial deployment.",
    source: "Industry trackers (Technology.org, applyingai.com)",
    sourceUrl: "https://www.technology.org/2026/07/18/humanoid-robots-in-2026-what-is-actually-deployed/",
    publicationDate: "2026-07-18",
    category: "Robotics",
    importance: "MEDIUM",
    kaiTake: "Production milestones and independently verified commercial deployment are two different claims -- worth reading past the headline on either company.",
    whyItMatters: "This is the clearest real-world signal yet that humanoid robots are moving from demo footage to paid work.",
    whatChanges: "Nothing for consumers yet -- both robots remain internal/industrial deployments, not products anyone can buy.",
    relatedTopics: ["humanoid robots", "Tesla Optimus", "Figure AI"],
    status: "RECENT",
    sourceQuality: "REPUTABLE_SECONDARY",
  },
  {
    id: "NEWS-005",
    title: "Neuralink targets high-volume brain-implant production and an automated surgical procedure in 2026",
    summary: "Neuralink has expanded its human trial to roughly two dozen participants across the US, UK, Canada, and UAE, and has scheduled the first patient trial of its Blindsight vision-restoration implant for 2026, alongside a stated goal of moving to fully automated implant surgery.",
    source: "Industry reporting (applyingai.com)",
    sourceUrl: "https://applyingai.com/2026/01/neuralinks-2026-high-volume-brain-implant-plan-scaling-bci-production-automation-and-market-impact/",
    publicationDate: "2026-01-01",
    category: "Research",
    importance: "MEDIUM",
    kaiTake: "Vision restoration is a materially different claim from cursor control -- it's the milestone worth tracking closest this year.",
    whyItMatters: "Restoring a lost sense would be a fundamentally harder and more significant result than any prior BCI milestone.",
    whatChanges: "Nothing yet for patients outside the trial -- this is a scheduled first trial, not an available treatment.",
    relatedTopics: ["brain-computer interfaces", "Neuralink", "medical AI"],
    status: "ARCHIVED",
    sourceQuality: "REPUTABLE_SECONDARY",
  },
];
