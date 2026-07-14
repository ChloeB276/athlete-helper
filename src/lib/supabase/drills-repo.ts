import type { Chat, ChatMessage, Folder } from "~/lib/drill-storage";
import type { Drill, DrillDifficulty } from "~/lib/soccer-feedback";
import { createClient } from "~/lib/supabase/client";

interface DrillRow {
  id: string;
  position_index: number;
  difficulty: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  kept: boolean;
}

interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  outro: string | null;
  created_at: string;
  drills: DrillRow[];
}

interface ChatRow {
  id: string;
  folder_id: string | null;
  title: string;
  position: string | null;
  updated_at: string;
  chat_messages: ChatMessageRow[];
}

function mapDrill(row: DrillRow): Drill {
  return {
    id: row.id,
    difficulty: row.difficulty as DrillDifficulty,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    kept: row.kept,
  };
}

function mapMessage(row: ChatMessageRow): ChatMessage {
  const drills = [...row.drills]
    .sort((a, b) => a.position_index - b.position_index)
    .map(mapDrill);
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    outro: row.outro ?? undefined,
    drills: drills.length > 0 ? drills : undefined,
  };
}

function mapChat(row: ChatRow): Chat {
  const messages = [...row.chat_messages]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(mapMessage);
  return {
    id: row.id,
    title: row.title,
    folderId: row.folder_id,
    position: row.position,
    messages,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function fetchFolders(): Promise<Folder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("id, name")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchChats(): Promise<Chat[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chats")
    .select(
      "id, folder_id, title, position, updated_at, chat_messages(id, role, content, outro, created_at, drills(id, position_index, difficulty, title, description, image_url, video_url, kept))",
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ChatRow[]).map(mapChat);
}

export async function createFolderRecord(folder: Folder): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("folders")
    .insert({ id: folder.id, name: folder.name });
  if (error) throw error;
}

export async function renameFolderRecord(
  id: string,
  name: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFolderRecord(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function createChatRecord(chat: Chat): Promise<void> {
  const supabase = createClient();
  const { error: chatError } = await supabase.from("chats").insert({
    id: chat.id,
    folder_id: chat.folderId,
    title: chat.title,
    position: chat.position,
    updated_at: new Date(chat.updatedAt).toISOString(),
  });
  if (chatError) throw chatError;

  const firstMessage = chat.messages[0];
  if (firstMessage) {
    const { error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        id: firstMessage.id,
        chat_id: chat.id,
        role: firstMessage.role,
        content: firstMessage.content,
      });
    if (messageError) throw messageError;
  }
}

export async function renameChatRecord(
  id: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("chats").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function moveChatRecord(
  id: string,
  folderId: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("chats")
    .update({ folder_id: folderId })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteChatRecord(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("chats").delete().eq("id", id);
  if (error) throw error;
}

export async function appendMessagesRecord(params: {
  chatId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  position: string | null;
  title: string;
  updatedAt: number;
}): Promise<void> {
  const { chatId, userMessage, assistantMessage, position, title, updatedAt } =
    params;
  const supabase = createClient();

  const { error: userMessageError } = await supabase
    .from("chat_messages")
    .insert({
      id: userMessage.id,
      chat_id: chatId,
      role: "user",
      content: userMessage.content,
    });
  if (userMessageError) throw userMessageError;

  const { error: assistantMessageError } = await supabase
    .from("chat_messages")
    .insert({
      id: assistantMessage.id,
      chat_id: chatId,
      role: "assistant",
      content: assistantMessage.content,
      outro: assistantMessage.outro ?? null,
    });
  if (assistantMessageError) throw assistantMessageError;

  if (assistantMessage.drills && assistantMessage.drills.length > 0) {
    const { error: drillsError } = await supabase.from("drills").insert(
      assistantMessage.drills.map((drill, index) => ({
        id: drill.id,
        message_id: assistantMessage.id,
        position_index: index,
        difficulty: drill.difficulty,
        title: drill.title,
        description: drill.description,
        image_url: drill.imageUrl,
        video_url: drill.videoUrl,
        kept: drill.kept,
      })),
    );
    if (drillsError) throw drillsError;
  }

  const { error: chatUpdateError } = await supabase
    .from("chats")
    .update({ position, title, updated_at: new Date(updatedAt).toISOString() })
    .eq("id", chatId);
  if (chatUpdateError) throw chatUpdateError;
}

export async function toggleKeepDrillRecord(
  drillId: string,
  kept: boolean,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("drills")
    .update({ kept })
    .eq("id", drillId);
  if (error) throw error;
}

export async function deleteDrillRecord(drillId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("drills").delete().eq("id", drillId);
  if (error) throw error;
}
