import { createClient } from "~/lib/supabase/server";

export interface AdminUserDrill {
  id: string;
  title: string;
  difficulty: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  createdAt: string;
  drills: AdminUserDrill[];
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (error || !data) return false;
  return data.is_admin;
}

interface ChatRow {
  user_id: string;
  chat_messages: { drills: AdminUserDrill[] }[];
}

export async function fetchAdminUserSummaries(): Promise<AdminUserSummary[]> {
  const supabase = await createClient();

  const [
    { data: profiles, error: profilesError },
    { data: chats, error: chatsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("chats")
      .select("user_id, chat_messages(drills(id, title, difficulty))"),
  ]);

  if (profilesError) throw profilesError;
  if (chatsError) throw chatsError;

  const drillsByUser = new Map<string, AdminUserDrill[]>();
  for (const chat of (chats ?? []) as unknown as ChatRow[]) {
    const existing = drillsByUser.get(chat.user_id) ?? [];
    for (const message of chat.chat_messages) {
      existing.push(...message.drills);
    }
    drillsByUser.set(chat.user_id, existing);
  }

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    createdAt: profile.created_at,
    drills: drillsByUser.get(profile.id) ?? [],
  }));
}
