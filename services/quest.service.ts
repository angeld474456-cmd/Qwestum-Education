export type TaskContent = Record<string, unknown>;

export interface QuestTask {
  id: string;
  quest_id: string;
  title: string;
  description: string | null;
  narrative_intro?: string | null;
  narrative_success?: string | null;
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
