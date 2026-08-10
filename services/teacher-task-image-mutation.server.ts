import "server-only";

import { getSafeQuestImageObjectPath } from "@/lib/storage/quest-image.server";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ImageMutationRow = {
  outcome?: unknown;
  id?: unknown;
  previous_image_url?: unknown;
  image_url?: unknown;
};

type ImageMutationSuccess = {
  id: string;
  previousImageUrl: string | null;
  imageUrl: string | null;
};

export type SetOwnedQuestTaskImageResult =
  | ({ status: "updated" } & ImageMutationSuccess)
  | ({ status: "stale_image" } & ImageMutationSuccess)
  | { status: "unauthorized" | "not_found" | "error" };

export type ClearOwnedQuestTaskImageResult =
  | ({ status: "cleared" } & ImageMutationSuccess)
  | ({ status: "stale_image" } & ImageMutationSuccess)
  | { status: "unauthorized" | "not_found" | "error" };

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isCanonicalImageUrl(
  imageUrl: string,
  userId: string,
  questId: string,
  taskId: string
) {
  return Boolean(getSafeQuestImageObjectPath(imageUrl, userId, questId, taskId));
}

function mapRow(
  value: unknown,
  taskId: string,
  userId: string,
  questId: string,
  expectedOutcome: "updated" | "cleared"
): ImageMutationSuccess | "stale_image" | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const row = value as ImageMutationRow;

  if (
    typeof row.id !== "string" ||
    row.id !== taskId ||
    !uuidPattern.test(row.id) ||
    !isNullableString(row.previous_image_url) ||
    !isNullableString(row.image_url)
  ) {
    return null;
  }

  if (row.outcome === "stale_image") {
    if (row.previous_image_url !== row.image_url) return null;
    if (
      row.image_url !== null &&
      !isCanonicalImageUrl(row.image_url, userId, questId, taskId)
    ) {
      return null;
    }

    return "stale_image";
  }

  if (row.outcome !== expectedOutcome) return null;

  if (
    expectedOutcome === "updated" &&
    (row.image_url === null ||
      !isCanonicalImageUrl(row.image_url, userId, questId, taskId))
  ) {
    return null;
  }

  if (expectedOutcome === "cleared" && row.image_url !== null) return null;

  return {
    id: row.id,
    previousImageUrl: row.previous_image_url,
    imageUrl: row.image_url,
  };
}

export async function setOwnedQuestTaskImage(input: {
  questId: string;
  taskId: string;
  expectedImageUrl: string | null;
  newObjectPath: string;
}): Promise<SetOwnedQuestTaskImageResult> {
  if (
    !uuidPattern.test(input.questId) ||
    !uuidPattern.test(input.taskId) ||
    !input.newObjectPath
  ) {
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
    ({ data, error } = await supabase.rpc("set_owned_quest_task_image", {
      p_quest_id: input.questId,
      p_task_id: input.taskId,
      p_expected_image_url: input.expectedImageUrl,
      p_new_object_path: input.newObjectPath,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1) return { status: "error" };

  const row = mapRow(data[0], input.taskId, user.id, input.questId, "updated");
  if (!row) return { status: "error" };
  if (row === "stale_image") {
    const stale = data[0] as ImageMutationRow;
    return {
      status: "stale_image",
      id: input.taskId,
      previousImageUrl: stale.previous_image_url as string | null,
      imageUrl: stale.image_url as string | null,
    };
  }

  return { status: "updated", ...row };
}

export async function clearOwnedQuestTaskImage(input: {
  questId: string;
  taskId: string;
  expectedImageUrl: string;
}): Promise<ClearOwnedQuestTaskImageResult> {
  if (
    !uuidPattern.test(input.questId) ||
    !uuidPattern.test(input.taskId) ||
    !input.expectedImageUrl.trim()
  ) {
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
    ({ data, error } = await supabase.rpc(
      "clear_owned_quest_task_image_if_matches",
      {
        p_quest_id: input.questId,
        p_task_id: input.taskId,
        p_expected_image_url: input.expectedImageUrl,
      }
    ));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1) return { status: "error" };

  const row = mapRow(data[0], input.taskId, user.id, input.questId, "cleared");
  if (!row) return { status: "error" };
  if (row === "stale_image") {
    const stale = data[0] as ImageMutationRow;
    return {
      status: "stale_image",
      id: input.taskId,
      previousImageUrl: stale.previous_image_url as string | null,
      imageUrl: stale.image_url as string | null,
    };
  }

  return { status: "cleared", ...row };
}
