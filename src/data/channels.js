// The two real Project KAI YouTube channels (Media Network + Engagement
// Expansion, Phase A/B). Channel IDs match youtube_gateway.py's
// KAI_YOUTUBE_CHANNEL_ID exactly and the generated public-data
// snapshot's "channels" field -- kept as a second, richer copy here
// because this file carries editorial/strategic content (pillars,
// website categories, "what belongs here") that has no place in a
// KAI_OS-generated, mechanically-derived snapshot. No subscriber
// counts, view counts, or any other live metric appears here -- see
// PROJECT_KAI_MEDIA_NETWORK_ARCHITECTURE.md, "Data honesty rules."
// This website never uploads, deletes, or reschedules on either
// channel; the fail-closed guard in youtube_gateway.py is the only
// thing that ever touches real YouTube state, and it is untouched by
// this file.

export const CHANNELS = [
  {
    id: "UCgEKqjS1eM4Q8KUxloKVNKA",
    slug: "projectkaiai",
    name: "ProjectKAIAI",
    role: "PRIMARY",
    tagline: "Discover",
    url: "https://www.youtube.com/channel/UCgEKqjS1eM4Q8KUxloKVNKA",
    tier: "status-development",
    statusLabel: "Real channel -- primary automated upload target (OAuth authorization pending)",
    description: "The primary media, discovery, and entertainment channel. This is the automated content pipeline's intended default upload destination, protected by a fail-closed channel-identity guard -- but no upload can happen until this channel's own OAuth token is authorized (a manual, one-time step; not yet done as of this check).",
    contentPillars: [
      "AI", "Technology", "Gadgets", "Apps", "Software", "AI tools",
      "Interesting inventions", "Future technology", "Science",
      "Discoveries", "Fascinating facts", "Experiments",
      "Documentary-style stories", "Technology history",
      "“What if?” concepts", "Emerging technologies",
      "Futuristic ideas", "Practical technology reviews",
      "App reviews", "Gadget reviews", "AI experiments",
      "Educational entertainment",
    ],
    websiteCategories: ["AI", "TECHNOLOGY", "SCIENCE", "GADGETS", "APPS", "DISCOVERIES", "FUTURE", "EXPERIMENTS", "REVIEWS", "DOCUMENTARIES", "SPACE", "ROBOTICS"],
    whatBelongsHere: "If a story is about discovering, watching, or being amazed by AI/technology -- a gadget review, a future-tech documentary, an experiment, a surprising fact -- it belongs on ProjectKAIAI.",
  },
  {
    id: "UC75pRQ4fzmpNDXUSaI9BNKQ",
    slug: "project-kai-ai-lessons",
    name: "Project Kai AI Lessons",
    role: "SECONDARY",
    tagline: "Learn",
    url: "https://www.youtube.com/channel/UC75pRQ4fzmpNDXUSaI9BNKQ",
    tier: "status-operational",
    statusLabel: "Real channel -- secondary automated upload target (OAuth connected)",
    description: "The secondary educational and practical AI channel, recently renamed from its prior identity. Its OAuth token is currently connected and verified; the pipeline can upload here explicitly for topics tagged for this destination, gated by the same fail-closed channel-identity guard as the primary channel.",
    contentPillars: [
      "AI lessons", "AI tutorials", "AI news", "AI updates",
      "AI explainers", "AI workflows", "AI productivity", "AI tools",
      "Beginner AI education", "Practical AI solutions",
      "KAI system updates", "AI app tutorials",
      "Automation tutorials", "“How to use AI” content",
    ],
    websiteCategories: ["AI", "TUTORIALS", "PRODUCTIVITY", "AUTOMATION", "NEWS", "IDEAS", "DIGITAL LIFE"],
    whatBelongsHere: "If a story teaches how to use something -- a tutorial, a workflow, an AI news explainer, a KAI system update -- it belongs on Project Kai AI Lessons.",
  },
];

export function getChannelBySlug(slug) {
  return CHANNELS.find((c) => c.slug === slug);
}

export function getChannelById(id) {
  return CHANNELS.find((c) => c.id === id);
}
