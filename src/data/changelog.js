// Every entry below is derived directly from this repository's real git
// history (`git log --pretty=format:"%h|%ad|%s" --date=short`), checked
// on 2026-08-09. Entries group related commits under one dated heading
// for public readability; commit subjects are lightly reworded for a
// public audience where the raw message was git-internal shorthand, but
// no entry describes work that didn't actually happen. Real commit
// hashes are kept as evidence -- verifiable with `git show <hash>` in
// this repo.
export const CHANGELOG = [
  {
    date: "2026-08-09",
    title: "Agent ↔ Website Data Integration",
    entries: [
      "Added a build-time public data bridge from the KAI OS codebase to this website -- one generator script, one sanitized JSON output, no live backend.",
      "Added the /status page, sourcing real agent, engineering, and production counts from that bridge.",
      "Agent counts are now cross-checked against the real source code (sub_agents/agents.py) every time the public data is generated -- the generator refuses to run if they disagree.",
    ],
    commits: ["e34785d"],
  },
  {
    date: "2026-08-04",
    title: "Design System Audit -- measured fixes",
    entries: [
      "Fixed a CSS specificity bug where the scroll-reveal animation system permanently overrode card hover speed on 10 of 14 card types, making hover feel sluggish after the page loaded.",
      "Consolidated 12 card-title font sizes (previously a 17-25px spread with no logic) into a deliberate 3-tier system.",
      "Removed an off-palette color that had leaked into 4 places via a duplicated CSS rule, and deleted the duplicate rule itself.",
      "Corrected homepage stats that no longer matched the site's own verified data (\"11+ AI Agents\" -> the real, verified 13).",
    ],
    commits: ["ce048e3", "a2a7e30", "e36cfb1", "c897193"],
  },
  {
    date: "2026-08-03",
    title: "World-Class Polish + Experience & Storytelling sprints",
    entries: [
      "Unified card padding and shadows across all 14 card types site-wide.",
      "Built the Agent Ecosystem section, sourcing real per-agent data from a new single source of truth (src/data/agents.js).",
      "Built the \"How KAI Works\" 8-stage pipeline section, Trust & Transparency section, and Documentation Preview.",
      "Rebuilt /agents to show all 13 real agents with two separate, honest status fields: Capability Status and Autonomous Agent Status.",
      "Redesigned the Roadmap as an honest Now/Next/Future/Vision timeline.",
      "Removed the last cyberpunk-era visual effects and established the current glass-card, calm-premium design language.",
      "Added accessibility skip-link and :focus-visible styling, and Organization/Person structured data for search engines.",
    ],
    commits: [
      "387e168", "8177dc2", "149e0d9", "ac2cc90", "140a905", "c074c48",
      "28f7df4", "def1c51", "076efda", "4ac5a2e", "823454c", "cdf36e9",
      "9ea108a", "c76a881", "c9d88e3", "c58b2dc", "2d029fa",
    ],
  },
  {
    date: "2026-08-02",
    title: "Mobile navigation",
    entries: ["Added a working hamburger menu for mobile navigation."],
    commits: ["326e033"],
  },
  {
    date: "2026-07-05 to 2026-07-17",
    title: "Initial launch",
    entries: [
      "Launched KAI OS website v1.0 on Astro.",
      "Published the first Project KAI article.",
      "Updated branding, SEO, and sitemap coverage.",
      "Replaced the boilerplate README with a real project description.",
    ],
    commits: ["b8d3715", "2539fa4", "e97331c", "4b8186d", "e0f74f9", "1ac453e"],
  },
];

export const CHANGELOG_LAST_UPDATED = "2026-08-09";
