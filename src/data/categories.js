// Shared content taxonomy (Media Network + Engagement Expansion,
// Section 7). One flat list, data-driven -- /discover filters over
// this rather than one page per category, per Section 70's explicit
// "do not create 20 duplicate routes unnecessarily."

export const CATEGORIES = [
  { key: "AI", label: "AI", description: "Artificial intelligence -- models, agents, and how they work." },
  { key: "TECHNOLOGY", label: "Technology", description: "Broad technology news, tools, and trends." },
  { key: "SCIENCE", label: "Science", description: "Discoveries and research across every field." },
  { key: "GADGETS", label: "Gadgets", description: "Devices worth knowing about." },
  { key: "APPS", label: "Apps", description: "Software you can use today." },
  { key: "SOFTWARE", label: "Software", description: "Tools, platforms, and how they're built." },
  { key: "DISCOVERIES", label: "Discoveries", description: "Things most people don't know yet." },
  { key: "FUTURE", label: "Future", description: "Where technology is headed -- clearly labeled as estimate, not fact." },
  { key: "FACTS", label: "Facts", description: "Short, sourced, verifiable facts." },
  { key: "EXPERIMENTS", label: "Experiments", description: "Questions we're testing, honestly labeled by whether they've actually run." },
  { key: "REVIEWS", label: "Reviews", description: "App and gadget reviews, honestly labeled by testing depth." },
  { key: "TUTORIALS", label: "Tutorials", description: "How to actually use AI and technology." },
  { key: "NEWS", label: "News", description: "Curated, sourced technology and AI news." },
  { key: "IDEAS", label: "Ideas", description: "Concepts and “what if” thinking." },
  { key: "DOCUMENTARIES", label: "Documentaries", description: "Longer-form, story-driven explorations." },
  { key: "PRODUCTIVITY", label: "Productivity", description: "Getting more done with AI and automation." },
  { key: "AUTOMATION", label: "Automation", description: "Making repeatable work run itself." },
  { key: "INTERNET", label: "Internet", description: "The web, platforms, and digital culture." },
  { key: "SPACE", label: "Space", description: "Exploration beyond Earth." },
  { key: "ROBOTICS", label: "Robotics", description: "Machines that move and act in the physical world." },
  { key: "DIGITAL LIFE", label: "Digital Life", description: "How technology changes daily life." },
];

export function getCategory(key) {
  return CATEGORIES.find((c) => c.key === key);
}
