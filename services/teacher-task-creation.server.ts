import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { QuestTask, TaskContent } from "@/services/quest.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedTaskTypes = new Set(["text", "single_choice", "multiple_choice", "sequence"]);

export type CreateOwnedQuestTaskInput = {
  questId: string;
  title: string;
  description: string;
  answer: string;
  hint: string;
  points: number;
  taskType: string;
  content: TaskContent | null;
};

export type CreateOwnedQuestTaskResult =
  | { status: "ok"; task: QuestTask }
  | { status: "task_limit_reached" }
  | { status: "unauthorized" | "not_found" | "error" };

function isTaskContent(value: unknown): value is TaskContent {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function mapCreatedTask(value: unknown, questId: string): QuestTask | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const row = value as Record<string, unknown>;

  if (
    row.outcome !== "created" ||
    typeof row.id !== "string" ||
    !uuidPattern.test(row.id) ||
    row.quest_id !== questId ||
    typeof row.title !== "string" ||
    !isNullableString(row.description) ||
    !isNullableString(row.answer) ||
    !isNullableString(row.hint) ||
    !isNullableString(row.image_url) ||
    row.image_url === "" ||
    typeof row.video_url !== "string" ||
    typeof row.audio_url !== "string" ||
    (row.content !== null && !isTaskContent(row.content)) ||
    typeof row.points !== "number" ||
    !Number.isSafeInteger(row.points) ||
    row.points < 1 ||
    typeof row.task_type !== "string" ||
    !allowedTaskTypes.has(row.task_type) ||
    typeof row.sort_order !== "number" ||
    !Number.isSafeInteger(row.sort_order)
  ) {
    return null;
  }

  return {
    id: row.id,
    quest_id: row.quest_id,
    title: row.title,
    description: row.description,
    answer: row.answer,
    hint: row.hint,
    image_url: row.image_url,
    video_url: row.video_url,
    audio_url: row.audio_url,
    content: row.content ?? null,
    points: row.points,
    task_type: row.task_type,
    sort_order: row.sort_order,
  };
}

function isTaskLimitResult(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const row = value as Record<string, unknown>;
  return row.outcome === "task_limit_reached" &&
    row.id === null &&
    row.quest_id === null &&
    row.title === null &&
    row.description === null &&
    row.answer === null &&
    row.hint === null &&
    row.image_url === null &&
    row.video_url === null &&
    row.audio_url === null &&
    row.content === null &&
    row.points === null &&
    row.task_type === null &&
    row.sort_order === null;
}

export async function createOwnedQuestTask(
  input: CreateOwnedQuestTaskInput
): Promise<CreateOwnedQuestTaskResult> {
  if (!uuidPattern.test(input.questId)) return { status: "not_found" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;

  try {
    ({ data, error } = await supabase.rpc("create_owned_quest_task", {
      p_quest_id: input.questId,
      p_title: input.title,
      p_description: input.description,
      p_answer: input.answer,
      p_hint: input.hint,
      p_points: input.points,
      p_task_type: input.taskType,
      p_content: input.content,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1) return { status: "error" };

  const task = mapCreatedTask(data[0], input.questId);
  if (task) return { status: "ok", task };

  if (isTaskLimitResult(data[0])) return { status: "task_limit_reached" };

  return { status: "error" };
}
