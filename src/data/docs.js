export const DOC_CATEGORIES = [
  {
    key: "overview",
    label: "01 · Overview",
    description: "Start with the product, its verified status, and the evidence behind public claims.",
    docs: [
      { title: "Project Overview", description: "What Project KAI is, what local-first means here, and where the owner remains in control.", route: "/about", status: "Available", cta: "Read" },
      { title: "System Status", description: "A build-time snapshot of real public system counts—not a live uptime dashboard.", route: "/status", status: "Available", cta: "View" },
      { title: "Engineering Changelog", description: "Git-sourced engineering history with evidence attached to each public entry.", route: "/changelog", status: "Available", cta: "Read" },
    ],
  },
  {
    key: "architecture",
    label: "02 · Architecture",
    description: "How authority, policy, specialized intelligence, tools, and memory fit together.",
    docs: [
      { title: "How KAI Works", description: "Observe, understand, plan, govern, act, review, and learn—with the action boundary stated clearly.", route: "/#how-it-works", status: "Available", cta: "Explore" },
      { title: "Memory & Orchestration", description: "The governed path from owner intent to domain action, evidence, and multiple persistent memories.", route: "/#memory-orchestration", status: "Available", cta: "Explore" },
      { title: "Agent Registry", description: "The 13 declared technical roles with underlying capability and autonomous-agent status separated.", route: "/agents", status: "Available", cta: "Review" },
      { title: "Command Center", description: "The public system map and status-aware navigation across KAI's current surfaces.", route: "/command-center", status: "Available", cta: "Open" },
    ],
  },
  {
    key: "capabilities",
    label: "03 · Capabilities",
    description: "Operational and in-development domains, without converting roadmap work into product claims.",
    docs: [
      { title: "Verified Capabilities", description: "Conversation, memory, content, trading research, analytics, and governance status in one view.", route: "/#capabilities", status: "Available", cta: "Explore" },
      { title: "Voice & Conversation", description: "Local spoken responses, English/Hindi routing, fallback behavior, and the neural-voice roadmap.", route: "/#voice", status: "Available", cta: "Explore" },
      { title: "Knowledge Brain", description: "A real local keyword-search capability over the engineering report corpus—not semantic universal memory.", route: "/knowledge", status: "Available", cta: "Open" },
      { title: "Desktop Operator", description: "The approval-first control architecture and the honest boundary around live desktop execution.", route: "/desktop-operator", status: "In Development", cta: "Review" },
    ],
  },
  {
    key: "content",
    label: "04 · Content Pipeline",
    description: "The working production system and its mandatory human publishing boundary.",
    docs: [
      { title: "Production Flow", description: "Topic, script, claims review, scenes, visuals, narration, captions, music, assembly, thumbnail, compliance, review, and publishing.", route: "/#ecosystem", status: "Available", cta: "Explore" },
      { title: "Media Network", description: "The real channels, deterministic content router, and public discovery surfaces fed by the production system.", route: "/media", status: "Available", cta: "Explore" },
      { title: "Human Review", description: "Why production automation stops before publishing and how that boundary shapes the system.", route: "/#trust", status: "Available", cta: "Review" },
    ],
  },
  {
    key: "trading",
    label: "05 · Trading Intelligence — Paper Only",
    description: "Research and broker validation under explicit paper-only and risk-governed constraints.",
    docs: [
      { title: "Paper-First Trading", description: "Market observation, strategy evaluation, governance, risk, and Alpaca Paper integration status.", route: "/#trading", status: "In Development", cta: "Review" },
      { title: "Safety Boundary", description: "Continuous paper execution is not enabled; live-money execution is not a current public capability.", route: "/#trading", status: "In Development", cta: "Review" },
      { title: "Research Lab", description: "Strategy research, simulation, backtesting, reporting, and the distinction between research and advice.", route: "/research", status: "Available", cta: "Explore" },
    ],
  },
  {
    key: "safety",
    label: "06 · Safety Model",
    description: "Human control, permission policy, stop controls, audit, privacy, and evidence.",
    docs: [
      { title: "Safety by Design", description: "Human checkpoints, paper-first validation, pause and emergency controls, and auditable operation.", route: "/#trust", status: "Available", cta: "Explore" },
      { title: "Security Architecture", description: "Default-deny capability authorization, revocation, kill switches, rate limits, and fail-closed policy handling.", route: "/security", status: "Available", cta: "Read" },
      { title: "Privacy", description: "What the public site collects, what it does not, and how public-safe disclosure is handled.", route: "/privacy", status: "Available", cta: "Read" },
    ],
  },
  {
    key: "roadmap",
    label: "07 · Roadmap",
    description: "Operational, next, and later work kept explicitly separate.",
    docs: [
      { title: "Public Roadmap", description: "Current foundations, next controlled milestones, and longer-term governed expansion.", route: "/#roadmap", status: "Available", cta: "Explore" },
      { title: "Contact", description: "The current owner contact path while dedicated project channels remain unresolved.", route: "/contact", status: "Available", cta: "Contact" },
    ],
  },
];
