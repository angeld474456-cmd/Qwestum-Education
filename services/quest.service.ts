import { supabase } from "@/lib/supabase";

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  is_public: boolean;
  created_at?: string;
}

export interface CreateQuestData {
  title: string;
  description: string;
  difficulty: number;
  is_public: boolean;
}

export type TaskContent = Record<string, unknown>;

export interface QuestTask {
  id: string;
  quest_id: string;
  title: string;
  description: string | null;
  answer: string | null;
  hint: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  content?: TaskContent | null;
  points: number;
  task_type: string;
  sort_order: number;
}

export async function createQuest(data: CreateQuestData) {
  return await supabase.from("quests").insert(data);
}

export async function getQuests() {
  return await supabase
    .from("quests")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function getQuest(id: string) {
  return await supabase
    .from("quests")
    .select("*")
    .eq("id", id)
    .single();
}

export async function getQuestTasks(questId: string) {
  return await supabase
    .from("quest_tasks")
    .select("*")
    .eq("quest_id", questId)
    .order("sort_order");
}

export async function createTask(data: Omit<QuestTask, "id">) {
  return await supabase
    .from("quest_tasks")
    .insert(data);
}

export async function updateTask(
  id: string,
  data: Partial<QuestTask>
) {
  return await supabase
    .from("quest_tasks")
    .update(data)
    .eq("id", id);
}

export async function deleteTask(id: string) {
  return await supabase
    .from("quest_tasks")
    .delete()
    .eq("id", id);
}
