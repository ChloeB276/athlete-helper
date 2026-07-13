export const HELP_WELCOME =
  "Hey! I'm here to help you use Athlete Helper — ask me about drills, folders, or your account. (I won't create drills here — head to Drills for that.)";

const TOPICS: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ["folder"],
    answer:
      'Create a folder from the "+ New folder" button in the Drills sidebar, then use the small dropdown next to any chat to move it into that folder.',
  },
  {
    keywords: ["delete", "remove"],
    answer:
      "Hover a chat or a drill and click the ✕ icon to delete it. This is permanent, so there's no undo.",
  },
  {
    keywords: ["drill", "start", "create", "feedback"],
    answer:
      "Head to Drills, start a new chat, tell it your position, then share a piece of feedback your coach gave you — it'll break it down into a full set of drills.",
  },
  {
    keywords: ["video", "visual", "image"],
    answer:
      'Turn on "Show Visuals" at the top of a Drills chat to see a thumbnail image and a video link for each drill.',
  },
  {
    keywords: ["sign out", "log out", "logout"],
    answer: 'Click "Sign Out" in the top right of the navbar any time.',
  },
  {
    keywords: ["account", "password", "email"],
    answer:
      "Account settings aren't available yet — for now, sign out and use the Sign Up / Sign In pages to manage your login.",
  },
];

const FALLBACK_ANSWER =
  "I'm just a simple help assistant for now, so I might not have that answer. Try asking about drills, folders, visuals, or your account.";

export function answerHelpQuestion(question: string): string {
  const normalized = question.toLowerCase();
  const match = TOPICS.find((topic) =>
    topic.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.answer ?? FALLBACK_ANSWER;
}
