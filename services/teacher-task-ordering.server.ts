import "server-only";

import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TeacherTaskReorderResult =
  | { status: "ok"; taskIds: string[] }
  | { status: "unauthorized" }
  | { status: "not_found" }
  | { status: "error" };

export async function reorderOwnedQuestTasks(questId: string, taskIds: string[]): Promise<TeacherTaskReorderResult> {
  if (
    !uuidPattern.test(questId) ||
    taskIds.length < 1 ||
    taskIds.length > 100 ||
    taskIds.some((id) => !uuidPattern.test(id)) ||
    new Set(taskIds).size !== taskIds.length
  ) {
    return { status: "not_found" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;

  try {
    ({ data, error } = await supabase.rpc("reorder_owned_quest_tasks", {
      p_quest_id: questId,
      p_task_ids: taskIds,
    }));
  } catch {
    return { status: "error" };
  }

  if (error) return { status: "error" };
  if (!Array.isArray(data) || data.length !== taskIds.length) return { status: "not_found" };

  const returnedRows = data.map((row) => {
    if (!row || typeof row !== "object") return null;

    const record = row as Record<string, unknown>;
    return typeof record.task_id === "string" &&
      typeof record.sort_order === "number" &&
      Number.isSafeInteger(record.sort_order)
      ? { taskId: record.task_id, sortOrder: record.sort_order }
      : null;
  });

  if (
    returnedRows.some((row) => row === null) ||
    returnedRows.some(
      (row, index) =>
        row === null ||
        row.taskId !== taskIds[index] ||
        row.sortOrder !== index + 1
    )
  ) {
    return { status: "error" };
  }

  return { status: "ok", taskIds };
}
