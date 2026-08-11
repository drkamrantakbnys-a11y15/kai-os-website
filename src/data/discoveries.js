// Discovery + KAI Documentary seed set (Media Network + Engagement
// Expansion, Sections 13-14). Merged into one /discover route rather
// than two separate pages -- a documentary is a content *format*
// (`format: "documentary"`, with chapters/timeline/sources), not a
// separate section, per Section 70's anti-duplication rule. Every
// `story`-format fact below is a real, independently verifiable claim
// with a source; every `documentary`-format entry is assembled only
// from facts already sourced elsewhere in this data layer (news.js,
// futureRadar.js, agents.js) -- never new unsourced claims.

export const DISCOVERY_THEMES = [
  "Things You Didn't Know", "Impossible Ideas", "Future Machines",
  "Strange Science", "AI That Feels Like Science Fiction",
  "Hidden Technology", "Unexpected Inventions", "Space & Beyond",
  "Digital Mysteries", "Human + Machine",
];

export const DISCOVERIES = [
  {
    id: "DISC-001",
    format: "story",
    theme: "Things You Didn't Know",
    title: "The first computer bug was an actual moth",
    summary: "In 1947, engineers working on the Harvard Mark II computer found a real moth trapped in a relay and taped it into the logbook, writing \"first actual case of bug being found.\" The term \"bug\" for a technical fault predates this by decades, but the moth is the most literal example on record.",
    category: "COMPUTING HISTORY",
    source: "Harvard Mark II logbook incident, Wikipedia (\"Software bug\")",
    sourceUrl: "https://en.wikipedia.org/wiki/Software_bug",
    kaiTake: "It's a fun coincidence more than an origin story -- but it's a real one, logbook photo and all.",
  },
  {
    id: "DISC-002",
    format: "story",
    theme: "Space & Beyond",
    title: "Voyager 1 is still transmitting from interstellar space",
    summary: "Launched in 1977, Voyager 1 crossed into interstellar space in 2012 and, as of recent NASA updates, is still returning data using a radio transmitter with less power than a refrigerator light bulb.",
    category: "SPACE",
    source: "NASA Voyager mission overview, Wikipedia (\"Voyager 1\")",
    sourceUrl: "https://en.wikipedia.org/wiki/Voyager_1",
    kaiTake: "Nearly 50-year-old hardware, still phoning home from outside the solar system -- a good reminder that reliability engineering is its own kind of achievement.",
  },
  {
    id: "DISC-003",
    format: "story",
    theme: "AI That Feels Like Science Fiction",
    title: "AlphaFold solved a 50-year-old grand challenge in biology",
    summary: "DeepMind's AlphaFold predicted 3D protein structures from amino acid sequences with accuracy that had eluded biologists for decades, a problem formally posed as a \"grand challenge\" back in 1972.",
    category: "AI",
    source: "AlphaFold, Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/AlphaFold",
    kaiTake: "This is the AI story that actually deserves the science-fiction comparison -- not a chatbot demo, a genuine open problem closed.",
  },
  {
    id: "DISC-004",
    format: "story",
    theme: "Hidden Technology",
    title: "Your phone's autocorrect traces back to a 1960s typo-fixing algorithm",
    summary: "Early spelling-correction techniques, including the Levenshtein distance algorithm (1965) for measuring how many edits separate two strings, underpin much of the autocorrect and spell-check technology still used today.",
    category: "SOFTWARE",
    source: "Levenshtein distance, Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Levenshtein_distance",
    kaiTake: "A 60-year-old piece of math is quietly fixing typos on billions of phones right now.",
  },
  {
    id: "DISC-005",
    format: "story",
    theme: "Strange Science",
    title: "Shakey the Robot had to think for over an hour to cross a room",
    summary: "Built at Stanford Research Institute between 1966 and 1972, Shakey was the first mobile robot able to reason about and plan its own actions -- but its early planning computations could take a very long time relative to today's robots.",
    category: "ROBOTICS",
    source: "Shakey the robot, Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Shakey_the_robot",
    kaiTake: "Every humanoid robot on the Future Radar today stands on this machine's shoulders.",
  },
  {
    id: "DISC-006",
    format: "story",
    theme: "Unexpected Inventions",
    title: "The Perceptron was built decades before it could actually be useful",
    summary: "Frank Rosenblatt's Perceptron (1958) was an early neural network capable of simple learned classification -- but the computing power to make deep networks genuinely useful didn't arrive until decades later.",
    category: "NEURAL NETWORKS",
    source: "Perceptron, Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Perceptron",
    kaiTake: "Modern deep learning isn't a new idea that suddenly appeared -- it's an old idea that finally got enough compute.",
  },
  {
    id: "DISC-007",
    format: "documentary",
    theme: "Future Machines",
    title: "The Future of Humanoid Robots",
    hook: "A robot that once took an hour to plan a single move is now doing paid factory work. What changed -- and how far is \"paid factory work\" from \"walks into your kitchen\"?",
    chapters: [
      { title: "Where we started", body: "Shakey the Robot (1966-1972) needed lengthy planning cycles just to navigate a room -- see DISC-005." },
      { title: "Where we are now", body: "Figure AI completed an 11-month BMW pilot and has paying customers; Tesla's Optimus Gen 3 entered low-volume internal production in 2026 -- see NEWS-004." },
      { title: "Where it might go", body: "Project KAI's own Future Radar estimates MEDIUM-HIGH confidence for verified, paid commercial deployment at scale within 1-2 years -- see FUTURE-001. This is a KAI Estimate, not a forecast." },
    ],
    keyFacts: ["DISC-005", "NEWS-004", "FUTURE-001"],
    sources: [
      { label: "Shakey the robot, Wikipedia", url: "https://en.wikipedia.org/wiki/Shakey_the_robot" },
      { label: "Humanoid robot deployment tracker", url: "https://www.technology.org/2026/07/18/humanoid-robots-in-2026-what-is-actually-deployed/" },
    ],
  },
  {
    id: "DISC-008",
    format: "documentary",
    theme: "AI That Feels Like Science Fiction",
    title: "Inside the Race for AI Chips",
    hook: "Every major AI lab is now also trying to become a chip company. Why would a software company need to design its own silicon?",
    chapters: [
      { title: "The cost problem", body: "Serving frontier AI models at scale is expensive enough that Anthropic, OpenAI, and Nvidia are all racing on custom silicon in 2026 -- see NEWS-001 and NEWS-002." },
      { title: "Who's doing what", body: "Anthropic is building an in-house chip team and exploring a Samsung partnership; OpenAI built a custom inference chip with Broadcom; Nvidia's own next-gen Vera CPU already counts Anthropic, OpenAI, and SpaceX among early users." },
      { title: "What it means", body: "Project KAI's Future Radar rates this trend HIGH confidence, already happening now, not speculative -- see FUTURE-003." },
    ],
    keyFacts: ["NEWS-001", "NEWS-002", "FUTURE-003"],
    sources: [
      { label: "Forbes: Anthropic enters the AI chip race", url: "https://www.forbes.com/sites/jonmarkman/2026/08/06/anthropic-enters-the-ai-chip-race-with-in-house-chip-team/" },
      { label: "Bloomberg: Nvidia's Vera chip users", url: "https://www.bloomberg.com/news/articles/2026-06-01/nvidia-says-anthropic-openai-among-big-users-of-new-vera-chip" },
    ],
  },
  {
    id: "DISC-009",
    format: "documentary",
    theme: "Human + Machine",
    title: "What Happens When AI Gets Memory?",
    hook: "Most AI agents forget everything the moment a conversation ends. What changes when they don't?",
    chapters: [
      { title: "The gap today", body: "Project KAI's own Memory Agent is real but not yet automated -- its ledger exists and is actively used, but entries are written manually by the engineering process, not by an autonomous agent (see /agents)." },
      { title: "Why it's hard", body: "Reliable long-term memory means deciding what's worth remembering, verifying it stays accurate, and never silently fabricating a memory -- the same standard this entire website holds itself to." },
      { title: "The honest roadmap", body: "Project KAI's own Future Radar rates general-purpose AI agents handling multi-step tasks with minimal supervision as MEDIUM-HIGH, 1-2 years out -- see FUTURE-008." },
    ],
    keyFacts: ["FUTURE-008"],
    sources: [
      { label: "Project KAI Agent Registry", url: "/agents" },
    ],
  },
];
