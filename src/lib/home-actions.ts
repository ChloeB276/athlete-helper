"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateDrillBreakdown } from "~/lib/drill-generation";
import { createClient } from "~/lib/supabase/server";

export async function generatePlan(formData: FormData) {
  const notes = formData.get("notes");
  if (typeof notes !== "string" || !notes.trim()) {
    throw new Error("Paste some coach notes first.");
  }
  const trimmed = notes.trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("positions")
    .eq("id", user.id)
    .single();
  const position: string | null = profile?.positions?.[0] ?? null;

  const { data: chats } = await supabase
    .from("chats")
    .select("id, training_partners, training_equipment")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);
  const latestChat = chats?.[0] ?? null;
  const trainingContext =
    latestChat && latestChat.training_partners !== null
      ? {
          partners: latestChat.training_partners as number,
          equipment: (latestChat.training_equipment ?? []) as string[],
        }
      : null;

  if (!position || !trainingContext) {
    redirect(`/drill-qa?feedback=${encodeURIComponent(trimmed)}`);
  }

  const result = await generateDrillBreakdown(
    trimmed,
    position,
    trainingContext,
  );
  if (!result) {
    throw new Error(
      "Couldn't find any matching drill videos for that just now. Please try again.",
    );
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      position,
      training_partners: trainingContext.partners,
      training_equipment: trainingContext.equipment,
      title: trimmed.slice(0, 40) || "New chat",
    })
    .select("id")
    .single();
  if (chatError) throw chatError;

  const { error: userMessageError } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: chat.id,
      role: "user",
      content: trimmed,
    });
  if (userMessageError) throw userMessageError;

  const { data: assistantMessage, error: assistantMessageError } =
    await supabase
      .from("chat_messages")
      .insert({
        chat_id: chat.id,
        role: "assistant",
        content: result.intro,
        outro: result.outro,
      })
      .select("id")
      .single();
  if (assistantMessageError) throw assistantMessageError;

  if (result.drills.length > 0) {
    const { error: drillsError } = await supabase.from("drills").insert(
      result.drills.map((drill, index) => ({
        message_id: assistantMessage.id,
        position_index: index,
        difficulty: drill.difficulty,
        title: drill.title,
        description: drill.description,
        source_title: drill.sourceTitle,
        image_url: drill.imageUrl,
        video_url: drill.videoUrl,
        kept: false,
      })),
    );
    if (drillsError) throw drillsError;
  }

  revalidatePath("/");
  revalidatePath("/session-plan");
}
