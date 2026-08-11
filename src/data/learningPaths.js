// Learning Paths (Live Website Master Implementation, Phase 16).
// Structural/curricular architecture only -- Project KAI does not
// host courses or track progress today (no login, no backend). Each
// step names a real topic; none claims a video exists for it unless
// linked. Paths route learners toward the real secondary channel
// (Project Kai AI Lessons) per the two-channel strategy: Discover on
// ProjectKAIAI, Learn on Project Kai AI Lessons.

export const LEARNING_PATHS = [
  {
    id: "path-ai-from-zero",
    title: "Learn AI From Zero",
    audience: "Beginner",
    description: "A ground-up path from \"what is AI\" to building your first agent.",
    steps: [
      { title: "What is AI?", description: "The basic idea: systems that perform tasks normally requiring human intelligence." },
      { title: "Machine Learning", description: "How systems learn patterns from data instead of following fixed rules." },
      { title: "Neural Networks", description: "The layered, connection-based structure underneath most modern AI." },
      { title: "LLMs", description: "Large language models -- what they are, and what they aren't." },
      { title: "Prompt Engineering", description: "Getting reliable, useful output from a language model." },
      { title: "AI Agents", description: "Systems that plan and take multi-step action, not just respond once." },
      { title: "RAG", description: "Retrieval-augmented generation -- grounding answers in real, searchable sources." },
      { title: "Automation", description: "Wiring AI into a repeatable, hands-off workflow." },
      { title: "Build an AI Agent", description: "Putting the previous eight steps together into one real project." },
    ],
  },
  {
    id: "path-ai-for-creators",
    title: "AI for Creators",
    audience: "Intermediate",
    description: "Practical AI tools for video, writing, and content production.",
    steps: [
      { title: "AI Image Tools", description: "Generating and iterating on visual concepts." },
      { title: "AI Video Tools", description: "Where AI genuinely speeds up production today, and where it doesn't yet." },
      { title: "AI Writing Assistants", description: "Drafting, editing, and idea generation without losing your own voice." },
      { title: "Thumbnail & Title Testing", description: "Using AI to generate options, not to make the final call." },
      { title: "Content Repurposing", description: "Turning one piece of research into multiple formats." },
    ],
  },
  {
    id: "path-ai-for-business",
    title: "AI for Business",
    audience: "Intermediate",
    description: "Where AI actually changes day-to-day business operations.",
    steps: [
      { title: "AI for Customer Support", description: "What's realistic today versus overpromised." },
      { title: "AI for Research", description: "Faster information gathering, with the same sourcing discipline as before." },
      { title: "AI for Reporting", description: "Summarizing and structuring information reliably." },
      { title: "Evaluating AI Vendors", description: "Questions worth asking before adopting a tool." },
    ],
  },
  {
    id: "path-ai-automation",
    title: "AI Automation",
    audience: "Intermediate",
    description: "Building repeatable, hands-off AI-assisted workflows.",
    steps: [
      { title: "What Should Be Automated?", description: "Recognizing genuinely repeatable tasks versus ones that need human judgment." },
      { title: "Automation Tools", description: "The landscape of no-code and code-based automation platforms." },
      { title: "Human-in-the-Loop Design", description: "Where approval gates belong in an automated pipeline -- the same principle Project KAI's own production pipeline uses." },
      { title: "Monitoring Automated Systems", description: "Knowing when an automation has quietly started failing." },
    ],
  },
  {
    id: "path-ai-for-students",
    title: "AI for Students",
    audience: "Beginner",
    description: "Using AI to learn faster without skipping the learning.",
    steps: [
      { title: "AI as a Study Partner", description: "Using AI to explain, not to answer for you." },
      { title: "Fact-Checking AI Output", description: "Why every AI claim needs an independent source check." },
      { title: "AI for Research Papers", description: "Where AI helps with structure and where it can mislead." },
      { title: "Academic Integrity", description: "Using AI tools without crossing into someone else's work." },
    ],
  },
  {
    id: "path-ai-tools",
    title: "AI Tools",
    audience: "All levels",
    description: "A practical tour of the current AI tool landscape.",
    steps: [
      { title: "Coding Tools", description: "See /reviews for Project KAI's own honestly-labeled coverage." },
      { title: "Image Tools", description: "See /reviews for Project KAI's own honestly-labeled coverage." },
      { title: "Voice Tools", description: "See /reviews for Project KAI's own honestly-labeled coverage." },
      { title: "Productivity Tools", description: "See /reviews for Project KAI's own honestly-labeled coverage." },
    ],
  },
  {
    id: "path-ai-agents",
    title: "AI Agents",
    audience: "Advanced",
    description: "How autonomous AI agents are actually designed and built.",
    steps: [
      { title: "Agent Architecture", description: "See /agent-builder for Project KAI's own educational walkthrough." },
      { title: "Tool Use", description: "How an agent decides which tool to call, and when." },
      { title: "Memory", description: "What an agent needs to remember, and what it should forget." },
      { title: "Human Approval Gates", description: "Why every consequential action should require sign-off -- see Project KAI's own real Agent Network for a working example (/agents)." },
    ],
  },
];

export function getLearningPath(id) {
  return LEARNING_PATHS.find((p) => p.id === id);
}
