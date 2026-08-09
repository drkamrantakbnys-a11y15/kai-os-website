// Documentation architecture manifest -- an index of this website's own
// real pages/sections, organized by category. This is deliberately NOT a
// second copy of DocumentationPreview.astro's internal-report catalog
// (Engineering Reports, CEO Reports, etc. -- those stay internal, that
// section's job is unchanged). This manifest's job is wayfinding: every
// entry links to a route that already exists and already works. No new
// content is authored here, only real routes are indexed.
export const DOC_CATEGORIES = [
  {
    key: "product",
    label: "01 -- Product",
    description: "What Project KAI actually does today.",
    docs: [
      {
        title: "How KAI Works",
        description: "The real 8-stage production pipeline -- Status, Source, and Human Control shown for every stage.",
        route: "/#how-it-works",
        status: "Available",
        cta: "Explore",
      },
      {
        title: "Agent Ecosystem",
        description: "The real pipeline flow agents cooperate in, with Human Checkpoint and Planned Connection steps explicitly labeled.",
        route: "/#ecosystem",
        status: "Available",
        cta: "Explore",
      },
      {
        title: "Agents",
        description: "All 13 real agents, grouped into 7 functional layers, each with Capability Status and Autonomous Agent Status.",
        route: "/agents",
        status: "Available",
        cta: "Explore",
      },
      {
        title: "Knowledge Brain",
        description: "The real keyword-search tool over 98 real engineering reports -- what it does and doesn't do, stated plainly.",
        route: "/knowledge",
        status: "Available",
        cta: "Explore",
      },
    ],
  },
  {
    key: "system",
    label: "02 -- System",
    description: "The current, evidence-backed state of the system.",
    docs: [
      {
        title: "System Status",
        description: "A build-time snapshot of real agent, engineering, and production counts -- not a live monitoring dashboard.",
        route: "/status",
        status: "Available",
        cta: "View",
      },
      {
        title: "Production Pipeline",
        description: "Real queue and completion counts for the content pipeline, shown on System Status.",
        route: "/status",
        status: "Available",
        cta: "View",
      },
    ],
  },
  {
    key: "engineering",
    label: "03 -- Engineering",
    description: "Real engineering history and standards.",
    docs: [
      {
        title: "Changelog",
        description: "Real, git-sourced engineering history with commit-hash evidence per entry -- not manufactured release notes.",
        route: "/changelog",
        status: "Available",
        cta: "Read",
      },
      {
        title: "Engineering Reports & Metrics",
        description: "Real internal report categories and engineering metrics -- most remain internal; see what's public below.",
        route: "/#documentation",
        status: "Available",
        cta: "View",
      },
      {
        title: "Data Integration Architecture",
        description: "How this website's public data is generated, sanitized, and verified from the real KAI OS codebase.",
        route: null,
        status: "Internal",
        cta: null,
      },
    ],
  },
  {
    key: "transparency",
    label: "04 -- Transparency",
    description: "Where evidence and human control live.",
    docs: [
      {
        title: "Trust & Transparency",
        description: "Six real pillars -- Human Review, Engineering Standards, Transparency, Continuous Improvement, Privacy, Future Philosophy.",
        route: "/#trust",
        status: "Available",
        cta: "Explore",
      },
      {
        title: "Privacy Policy",
        description: "What this static site does and doesn't collect -- true by construction, not just by policy.",
        route: "/privacy",
        status: "Available",
        cta: "Read",
      },
    ],
  },
  {
    key: "company",
    label: "05 -- Company",
    description: "What Project KAI is and who's building it.",
    docs: [
      {
        title: "About",
        description: "Why Project KAI exists and how it relates to KAI OS.",
        route: "/about",
        status: "Available",
        cta: "Read",
      },
      {
        title: "Founder",
        description: "Who's building Project KAI and KAI OS.",
        route: "/#founder",
        status: "Available",
        cta: "Read",
      },
      {
        title: "Roadmap",
        description: "Now / Next / Future / Vision -- what's committed and what's direction, kept explicitly separate.",
        route: "/#roadmap",
        status: "Available",
        cta: "Explore",
      },
      {
        title: "Contact",
        description: "How to reach the project.",
        route: "/contact",
        status: "Available",
        cta: "Contact",
      },
    ],
  },
];
