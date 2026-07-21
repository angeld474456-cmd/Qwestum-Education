import "server-only";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TeacherQuest = {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  is_public: boolean;
  grade_min: number | null;
  grade_max: number | null;
  estimated_duration_minutes: number | null;
  created_at?: string;
  author_id: string | null;
};

export type TeacherQuestTask = {
  id: string;
  quest_id: string;
  title: string;
  description: string | null;
  answer: string | null;
  hint: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  content?: Record<string, unknown> | null;
  points: number;
  task_type: string;
  sort_order: number;
};

export type TeacherQuestTaskSummary = {
  quest_id: string;
  points: number | null;
};

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
  };
}

export async function getCurrentTeacherUser(): Promise<User | null> {
  const { user } = await getAuthenticatedContext();

  return user;
}

export async function getOwnedQuests(): Promise<TeacherQuest[]> {
  const { supabase, user } = await getAuthenticatedContext();

  if (!user) return [];

  const { data, error } = await supabase
    .from("quests")
    .select(
      "id, title, description, difficulty, is_public, grade_min, grade_max, estimated_duration_minutes, created_at, author_id"
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TeacherQuest[];
}

export async function getOwnedQuest(id: string): Promise<TeacherQuest | null> {
  if (!uuidPattern.test(id)) return null;

  const { supabase, user } = await getAuthenticatedContext();

  if (!user) return null;

  const { data, error } = await supabase
    .from("quests")
    .select(
      "id, title, description, difficulty, is_public, grade_min, grade_max, estimated_duration_minutes, created_at, author_id"
    )
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as TeacherQuest | null) ?? null;
}

export async function getOwnedQuestTasks(
  questId: string
): Promise<TeacherQuestTask[] | null> {
  if (!uuidPattern.test(questId)) return null;

  const { supabase, user } = await getAuthenticatedContext();

  if (!user) return null;

  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select("id")
    .eq("id", questId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (questError) {
    throw questError;
  }

  if (!quest) return null;

  const { data, error } = await supabase
    .from("quest_tasks")
    .select("*")
    .eq("quest_id", questId)
    .order("sort_order");

  if (error) {
    throw error;
  }

  return (data ?? []) as TeacherQuestTask[];
}

export async function getOwnedQuestTaskSummary(): Promise<
  TeacherQuestTaskSummary[]
> {
  const { supabase, user } = await getAuthenticatedContext();

  if (!user) return [];

  const { data: quests, error: questsError } = await supabase
    .from("quests")
    .select("id")
    .eq("author_id", user.id);

  if (questsError) {
    throw questsError;
  }

  const questIds = (quests ?? []).map((quest) => quest.id);

  if (questIds.length === 0) return [];

  const { data, error } = await supabase
    .from("quest_tasks")
    .select("quest_id, points")
    .in("quest_id", questIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as TeacherQuestTaskSummary[];
}
