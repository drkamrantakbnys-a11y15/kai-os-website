// Public-safe product model for the August 2026 website refresh.
//
// These entries describe verified capabilities, not every module present in
// KAI OS. Status is intentionally conservative: Operational means a bounded
// capability works today, In Development means meaningful implementation
// exists but the complete public-facing or continuously-running experience
// does not, and Planned means it remains roadmap only.

export const PRODUCT_CAPABILITIES = [
  {
    key: "conversation",
    code: "VOICE",
    title: "Conversational AI",
    status: "Operational",
    tier: "status-operational",
    summary: "A local-first conversational layer with context-aware responses and verified English/Hindi output routing.",
    points: ["Local spoken responses", "English and Hindi output", "Offline/local fallback"],
  },
  {
    key: "memory",
    code: "MEM",
    title: "Memory & Orchestration",
    status: "Operational",
    tier: "status-operational",
    summary: "Knowledge Brain and Developer Memory operate behind a bounded task lifecycle and explicit capability policy.",
    points: ["Persistent decision records", "Knowledge and failure memory", "Evidence-aware task routing"],
  },
  {
    key: "content",
    code: "MEDIA",
    title: "Content Production",
    status: "Operational",
    tier: "status-operational",
    summary: "A real production pipeline coordinates scripts, media, narration, captions, assembly, compliance, and review.",
    points: ["Multi-stage production", "Claims and compliance review", "Human-controlled publishing"],
  },
  {
    key: "trading",
    code: "PAPER",
    title: "Trading Intelligence",
    status: "In Development",
    tier: "status-development",
    summary: "A mature research and risk stack is being validated against Alpaca Paper. Continuous paper execution is not enabled.",
    points: ["Market and strategy evaluation", "Risk and exposure controls", "Alpaca Paper integration"],
  },
  {
    key: "research",
    code: "LAB",
    title: "Research & Analytics",
    status: "In Development",
    tier: "status-development",
    summary: "Structured research, simulation, backtesting, reporting, and domain analytics support evidence-based development.",
    points: ["Backtesting and simulation", "Structured reporting", "Performance research"],
  },
  {
    key: "governance",
    code: "SAFE",
    title: "Governance",
    status: "Operational",
    tier: "status-operational",
    summary: "Consequential capabilities sit behind permission gates, human checkpoints, kill switches, pause controls, and audit trails.",
    points: ["Default-deny permissions", "Pause and emergency controls", "Auditable decisions"],
  },
];

export const PRODUCT_SYSTEMS = [
  {
    code: "CONV",
    title: "Conversation Layer",
    status: "Operational",
    tier: "status-operational",
    description: "Local conversation, multilingual routing, and spoken output with an offline-first fallback path.",
  },
  {
    code: "PROD",
    title: "Content Production",
    status: "Operational",
    tier: "status-operational",
    description: "A linear production system with real media stages and mandatory human review before publishing.",
  },
  {
    code: "KNOW",
    title: "Knowledge Brain",
    status: "Operational",
    tier: "status-operational",
    description: "A callable, local keyword-search capability over the engineering report corpus; not a semantic universal memory.",
  },
  {
    code: "MEM",
    title: "Developer Memory",
    status: "Operational",
    tier: "status-operational",
    description: "Append-only records for decisions, fixes, failures, and lessons, exposed through a bounded agent adapter.",
  },
  {
    code: "TRD",
    title: "Trading Intelligence",
    status: "In Development",
    tier: "status-development",
    description: "Professional research, strategy, broker, and risk intelligence under controlled paper-only validation.",
  },
  {
    code: "DESK",
    title: "Desktop Operator",
    status: "In Development",
    tier: "status-development",
    description: "Permission and approval architecture for future controlled desktop actions; unrestricted control is not active.",
  },
];

export const DOCUMENTATION_AREAS = [
  {
    title: "Overview",
    description: "What Project KAI is, what it can do today, and where human control remains mandatory.",
    route: "/about",
    status: "Available",
  },
  {
    title: "Architecture",
    description: "The owner, governance, specialized-intelligence, tools, and evidence layers that make up KAI OS.",
    route: "/#memory-orchestration",
    status: "Available",
  },
  {
    title: "Capabilities",
    description: "Operational and in-development capability groups, with status shown directly on every card.",
    route: "/#capabilities",
    status: "Available",
  },
  {
    title: "Safety Model",
    description: "Human review, permission gates, local-first processing, kill switches, and auditable operation.",
    route: "/security",
    status: "Available",
  },
  {
    title: "Content Pipeline",
    description: "The real path from a human-curated topic to reviewed, human-controlled publishing.",
    route: "/#ecosystem",
    status: "Available",
  },
  {
    title: "Trading — Paper Only",
    description: "The current research and validation boundary, including what is not continuously or live-money enabled.",
    route: "/#trading",
    status: "In Development",
  },
  {
    title: "Voice",
    description: "Local spoken responses, English/Hindi output routing, fallback behavior, and the neural-voice roadmap.",
    route: "/#voice",
    status: "Available",
  },
  {
    title: "Roadmap",
    description: "Operational, next, and later work kept explicitly separate from completed capability claims.",
    route: "/#roadmap",
    status: "Available",
  },
];
