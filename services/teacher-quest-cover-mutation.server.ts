import "server-only";

import { getSafeQuestCoverImageObjectPath } from "@/lib/storage/quest-cover.server";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CoverMutationRow = {
  outcome?: unknown;
  id?: unknown;
  previous_cover_image_path?: unknown;
  cover_image_path?: unknown;
};

type CoverMutation = {
  id: string;
  previousCoverImagePath: string | null;
  coverImagePath: string | null;
};

export type SetOwnedQuestCoverImageResult =
  | ({ status: "updated" | "already_current" | "stale_cover" } & CoverMutation)
  | { status: "unauthorized" | "not_found" | "error" };

export type ClearOwnedQuestCoverImageResult =
  | ({ status: "cleared" | "already_clear" | "stale_cover" } & CoverMutation)
  | { status: "unauthorized" | "not_found" | "error" };

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isCanonicalCoverPath(path: string, userId: string, questId: string) {
  return Boolean(getSafeQuestCoverImageObjectPath(path, userId, questId));
}

function mapRow(
  value: unknown,
  questId: string,
  userId: string,
  allowedOutcomes: readonly string[]
): { outcome: string; mutation: CoverMutation } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const row = value as CoverMutationRow;
  const expectedKeys = [
    "cover_image_path",
    "id",
    "outcome",
    "previous_cover_image_path",
  ];
  const keys = Object.keys(row).sort();

  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index]) ||
    typeof row.outcome !== "string" ||
    !allowedOutcomes.includes(row.outcome) ||
    row.id !== questId ||
    !uuidPattern.test(questId) ||
    !isNullableString(row.previous_cover_image_path) ||
    !isNullableString(row.cover_image_path)
  ) {
    return null;
  }

  for (const path of [row.previous_cover_image_path, row.cover_image_path]) {
    if (path !== null && !isCanonicalCoverPath(path, userId, questId)) return null;
  }

  if (
    (row.outcome === "stale_cover" || row.outcome === "already_current") &&
    row.previous_cover_image_path !== row.cover_image_path
  ) {
    return null;
  }

  if (row.outcome === "updated" && row.cover_image_path === null) return null;
  if ((row.outcome === "cleared" || row.outcome === "already_clear") && row.cover_image_path !== null) {
    return null;
  }

  return {
    outcome: row.outcome,
    mutation: {
      id: questId,
      previousCoverImagePath: row.previous_cover_image_path,
      coverImagePath: row.cover_image_path,
    },
  };
}

export async function setOwnedQuestCoverImage(input: {
  questId: string;
  expectedCoverImagePath: string | null;
  newObjectPath: string;
}): Promise<SetOwnedQuestCoverImageResult> {
  if (!uuidPattern.test(input.questId) || !input.newObjectPath) return { status: "error" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;
  try {
    ({ data, error } = await supabase.rpc("set_owned_quest_cover_image", {
      p_quest_id: input.questId,
      p_expected_cover_image_path: input.expectedCoverImagePath,
      p_new_object_path: input.newObjectPath,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1) return { status: "error" };

  const mapped = mapRow(data[0], input.questId, user.id, ["updated", "already_current", "stale_cover"]);
  return mapped ? { status: mapped.outcome as "updated" | "already_current" | "stale_cover", ...mapped.mutation } : { status: "error" };
}

export async function clearOwnedQuestCoverImage(input: {
  questId: string;
  expectedCoverImagePath: string | null;
}): Promise<ClearOwnedQuestCoverImageResult> {
  if (!uuidPattern.test(input.questId)) return { status: "error" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;
  try {
    ({ data, error } = await supabase.rpc("clear_owned_quest_cover_image_if_matches", {
      p_quest_id: input.questId,
      p_expected_cover_image_path: input.expectedCoverImagePath,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1) return { status: "error" };

  const mapped = mapRow(data[0], input.questId, user.id, ["cleared", "already_clear", "stale_cover"]);
  return mapped ? { status: mapped.outcome as "cleared" | "already_clear" | "stale_cover", ...mapped.mutation } : { status: "error" };
}
