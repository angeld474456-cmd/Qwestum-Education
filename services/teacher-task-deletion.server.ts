import "server-only";

import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DeleteOwnedQuestTaskRpcRow = {
  outcome?: unknown;
  id?: unknown;
  image_url?: unknown;
};

export type DeleteOwnedQuestTaskResult =
  | { status: "unauthorized" }
  | { status: "not_found" }
  | { status: "last_public_task" }
  | { status: "error" }
  | {
      status: "deleted";
      id: string;
      imageUrl: string | null;
      userId: string;
    };

function isExactRpcRow(value: unknown): value is DeleteOwnedQuestTaskRpcRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return (
    keys.length === 3 &&
    keys.includes("outcome") &&
    keys.includes("id") &&
    keys.includes("image_url")
  );
}

function parseRpcRow(
  value: unknown,
  taskId: string,
  userId: string
): DeleteOwnedQuestTaskResult | null {
  if (!isExactRpcRow(value)) {
    return null;
  }

  if (
    value.outcome === "last_public_task" &&
    value.id === null &&
    value.image_url === null
  ) {
    return { status: "last_public_task" };
  }

  if (
    value.outcome === "deleted" &&
    typeof value.id === "string" &&
    uuidPattern.test(value.id) &&
    value.id === taskId &&
    (typeof value.image_url === "string" || value.image_url === null)
  ) {
    return {
      status: "deleted",
      id: value.id,
      imageUrl: value.image_url,
      userId,
    };
  }

  return null;
}

export async function deleteOwnedQuestTask(
  questId: string,
  taskId: string
): Promise<DeleteOwnedQuestTaskResult> {
  if (!uuidPattern.test(questId) || !uuidPattern.test(taskId)) {
    return { status: "not_found" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { status: "unauthorized" };
    }

    const { data, error } = await supabase.rpc("delete_owned_quest_task", {
      p_quest_id: questId,
      p_task_id: taskId,
    });

    if (error || !Array.isArray(data)) {
      return { status: "error" };
    }

    if (data.length === 0) {
      return { status: "not_found" };
    }

    if (data.length !== 1) {
      return { status: "error" };
    }

    return parseRpcRow(data[0], taskId, user.id) ?? { status: "error" };
  } catch {
    return { status: "error" };
  }
}
