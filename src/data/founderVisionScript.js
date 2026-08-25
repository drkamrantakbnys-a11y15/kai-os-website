// Approved script for the founder-vision video -- the source of truth for
// whenever the real video (with an owner-approved AI avatar, per the
// explicit "do not fabricate the final founder likeness" instruction) is
// produced. Kept as content-data rather than hard-coded into the video
// modal component, so producing the real video never requires touching
// component code -- only dropping the finished asset into
// public/media/vision/ (see that directory's own README.md).
//
// Nothing here claims a capability the site doesn't already honestly
// document elsewhere (no guaranteed income, no guaranteed trading
// returns, no AGI, no autonomous live trading).

export const FOUNDER_VISION_SCRIPT_META = {
  targetLengthSeconds: { min: 90, max: 120 },
  themes: [
    "why Project KAI exists",
    "KAI is more than a chatbot",
    "specialized agents and divisions",
    "research",
    "content and media intelligence",
    "business automation",
    "software and AI development",
    "paper-trading research",
    "evidence-grounded intelligence",
    "human-controlled self-improvement",
    "local AI and Ollama",
    "progressive independence from external AI services",
    "community participation",
    "global collaboration",
    "support for continued development",
  ],
  approvedAt: "2026-08-25",
  status: "APPROVED_SCRIPT_NO_VIDEO_YET",
};

export const FOUNDER_VISION_SCRIPT_PARAGRAPHS = [
  "Hello. I'm the founder of Project KAI.",
  "What you are looking at is not simply another AI chatbot.",
  "Project KAI is an attempt to build something much larger -- an intelligent operating ecosystem composed of specialized AI agents that can research, analyze, create, learn, coordinate and progressively improve.",
  "KAI is being designed to understand its own operations, work with specialized divisions, evaluate evidence, learn from results and present its progress transparently -- while important decisions remain under human control.",
  "Today, much of artificial intelligence depends on isolated tools and external services.",
  "Our longer-term objective is different.",
  "We want KAI to become progressively more capable and independent by using local AI models, persistent knowledge, specialized agents, structured evidence and accumulated experience.",
  "But serious AI development requires resources.",
  "Compute, model access, APIs, market and research data, testing infrastructure, development tools and storage all have real costs.",
  "If you believe this project deserves to exist, you can help us continue building it.",
  "You can support Project KAI from as little as five dollars, or become a monthly supporter beginning at ten dollars.",
  "Every contribution helps us improve KAI, expand its capabilities and move closer to a more independent AI architecture.",
  "But financial support is only one way to participate.",
  "If you're a developer, researcher, designer, entrepreneur, strategist, AI enthusiast -- or simply someone with a strong idea that could make KAI better -- you're welcome to contribute your thinking.",
  "Project KAI should not grow from one person's ideas alone.",
  "It should grow from good ideas.",
  "So explore the project.",
  "Talk to KAI.",
  "Challenge it.",
  "Suggest what we should build next.",
  "And if you believe in the vision, become one of the people helping us build it.",
  "We are not promising the future.",
  "We are building toward it.",
  "Welcome to Project KAI.",
];
