import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { QuestTask, TaskContent } from "@/services/quest.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedTaskTypes = new Set(["text", "single_choice", "multiple_choice"]);

export type UpdateOwnedQuestTaskInput = {
  questId: string;
  taskId: string;
  title: string;
  description: string;
  points: number;
  content: TaskContent | null;
};

export type UpdatedQuestTask = Omit<QuestTask, "sort_order"> & {
  sort_order: number | null;
};

export type UpdateOwnedQuestTaskResult =
  | { status: "updated"; task: UpdatedQuestTask }
  | { status: "unauthorized" | "not_found" | "error" };

function isTaskContent(value: unknown): value is TaskContent {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableSafeInteger(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isSafeInteger(value));
}

function mapUpdatedTask(value: unknown, questId: string): UpdatedQuestTask | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    !uuidPattern.test(row.id) ||
    row.quest_id !== questId ||
    typeof row.title !== "string" ||
    typeof row.description !== "string" ||
    !isNullableString(row.answer) ||
    !isNullableString(row.hint) ||
    !isNullableString(row.image_url) ||
    !isNullableString(row.video_url) ||
    !isNullableString(row.audio_url) ||
    (row.content !== null && !isTaskContent(row.content)) ||
    typeof row.points !== "number" ||
    !Number.isSafeInteger(row.points) ||
    row.points < 1 ||
    typeof row.task_type !== "string" ||
    !allowedTaskTypes.has(row.task_type) ||
    !isNullableSafeInteger(row.sort_order)
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

export async function updateOwnedQuestTask(
  input: UpdateOwnedQuestTaskInput
): Promise<UpdateOwnedQuestTaskResult> {
  if (!uuidPattern.test(input.questId) || !uuidPattern.test(input.taskId)) {
    return { status: "error" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;

  try {
    ({ data, error } = await supabase.rpc("update_owned_quest_task_content", {
      p_quest_id: input.questId,
      p_task_id: input.taskId,
      p_title: input.title,
      p_description: input.description,
      p_points: input.points,
      p_content: input.content,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1) return { status: "error" };

  const task = mapUpdatedTask(data[0], input.questId);
  return task ? { status: "updated", task } : { status: "error" };
}
