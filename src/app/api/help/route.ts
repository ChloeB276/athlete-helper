import { generateText, type ModelMessage } from "ai";
import { chatModel } from "~/lib/ai";

const SYSTEM_PROMPT = `You are the in-app help assistant for Athlete Helper, a soccer training app. Only answer using these facts:
- Drills: on the Drills page, start a new chat, tell it your position, then share feedback from your coach — it breaks the feedback into a set of drills.
- Folders: create one from "+ New folder" in the Drills sidebar; move a chat into a folder using the small dropdown next to it.
- Deleting: hover a chat or drill and click the ✕ icon. This is permanent — there's no undo.
- Visuals: toggle "Show Visuals" at the top of a Drills chat to see a thumbnail image and video link for each drill.
- Signing out: click "Sign Out" in the top right of the navbar.
- Account settings aren't available yet — sign out and use the Sign Up / Sign In pages to manage your login.
If a question falls outside these topics, say you're a simple help assistant for Athlete Helper and can't help with that. Keep answers under 3 sentences.`;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages?: ModelMessage[];
  };

  if (!messages?.length) {
    return Response.json({ error: "messages are required" }, { status: 400 });
  }

  try {
    const { text } = await generateText({
      model: chatModel,
      system: SYSTEM_PROMPT,
      messages,
    });

    return Response.json({ answer: text });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to reach the help assistant" },
      { status: 502 },
    );
  }
}
