import "server-only";

import {
  getSafeQuestCoverImageObjectPath,
  questCoverImageBucketName,
} from "@/lib/storage/quest-cover.server";
import {
  getSafeQuestImageObjectPath,
  questImageBucketName,
} from "@/lib/storage/quest-image.server";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const taskImagePublicPrefix = "/storage/v1/object/public/quest-images/";

type DeleteOwnedQuestRpcRow = {
  outcome: "deleted";
  id: string;
  cover_image_path: string | null;
  task_image_urls: string[];
};

export type DeleteOwnedQuestResult =
  | { status: "ok" }
  | { status: "unauthorized" | "not_found" | "error" };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isDeletedQuestRpcRow(
  value: unknown,
  questId: string
): value is DeleteOwnedQuestRpcRow {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value).sort();
  const expectedKeys = [
    "cover_image_path",
    "id",
    "outcome",
    "task_image_urls",
  ];

  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index])
  ) {
    return false;
  }

  return (
    value.outcome === "deleted" &&
    value.id === questId &&
    (typeof value.cover_image_path === "string" ||
      value.cover_image_path === null) &&
    Array.isArray(value.task_image_urls) &&
    value.task_image_urls.every((imageUrl) => typeof imageUrl === "string")
  );
}

function getTaskIdFromQuestImageUrl(imageUrl: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return null;

  try {
    const publicUrl = new URL(imageUrl);
    const projectUrl = new URL(supabaseUrl);

    if (publicUrl.origin !== projectUrl.origin) return null;
    if (!publicUrl.pathname.startsWith(taskImagePublicPrefix)) return null;

    const objectPath = decodeURIComponent(
      publicUrl.pathname.slice(taskImagePublicPrefix.length)
    );
    const segments = objectPath.split("/");

    if (segments.length !== 7 || segments[4] !== "tasks") return null;

    return uuidPattern.test(segments[5]) ? segments[5] : null;
  } catch {
    return null;
  }
}

export async function deleteOwnedQuest(
  questId: string
): Promise<DeleteOwnedQuestResult> {
  if (!uuidPattern.test(questId)) {
    return { status: "not_found" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthorized" };
  }

  const { data, error } = await supabase.rpc("delete_owned_quest", {
    p_quest_id: questId,
  });

  if (error) {
    return { status: "error" };
  }

  if (!Array.isArray(data)) {
    return { status: "error" };
  }

  if (data.length === 0) {
    return { status: "not_found" };
  }

  if (data.length !== 1 || !isDeletedQuestRpcRow(data[0], questId)) {
    return { status: "error" };
  }

  const deletedQuest = data[0];
  const coverPath = getSafeQuestCoverImageObjectPath(
    deletedQuest.cover_image_path,
    user.id,
    questId
  );
  const taskImagePaths = new Set<string>();

  for (const imageUrl of deletedQuest.task_image_urls) {
    const taskId = getTaskIdFromQuestImageUrl(imageUrl);

    if (!taskId) continue;

    const imagePath = getSafeQuestImageObjectPath(
      imageUrl,
      user.id,
      questId,
      taskId
    );

    if (imagePath) {
      taskImagePaths.add(imagePath);
    }
  }

  if (coverPath) {
    try {
      await supabase.storage
        .from(questCoverImageBucketName)
        .remove([coverPath]);
    } catch {
      // A confirmed database deletion remains successful if external cleanup fails.
    }
  }

  if (taskImagePaths.size > 0) {
    try {
      await supabase.storage
        .from(questImageBucketName)
        .remove(Array.from(taskImagePaths));
    } catch {
      // A confirmed database deletion remains successful if external cleanup fails.
    }
  }

  return { status: "ok" };
}
