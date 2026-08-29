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
import { getTeacherAuthoringAccess } from "@/services/teacher-authoring-access.server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DeleteOwnedQuestRpcRow = {
  outcome: "deleted";
  id: string;
  cover_image_path: string | null;
  task_image_urls: string[];
};

type OwnedQuestMediaRow = {
  id: string;
  cover_image_path: string | null;
};

type OwnedTaskImageRow = {
  id: string;
  image_url: string | null;
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

async function removeCanonicalObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucketName: string,
  objectPath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([objectPath]);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteOwnedQuest(
  questId: string
): Promise<DeleteOwnedQuestResult> {
  if (!uuidPattern.test(questId)) {
    return { status: "not_found" };
  }

  const access = await getTeacherAuthoringAccess();

  if (access.status === "unauthenticated") {
    return { status: "unauthorized" };
  }

  if (access.status !== "allowed") {
    return { status: "error" };
  }

  const supabase = await createClient();
  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select("id, cover_image_path")
    .eq("id", questId)
    .eq("author_id", access.userId)
    .maybeSingle<OwnedQuestMediaRow>();

  if (questError) {
    return { status: "error" };
  }

  if (!quest) {
    return { status: "not_found" };
  }

  const { data: taskImages, error: taskImagesError } = await supabase
    .from("quest_tasks")
    .select("id, image_url")
    .eq("quest_id", questId)
    .order("id", { ascending: true });

  if (taskImagesError || !Array.isArray(taskImages)) {
    return { status: "error" };
  }

  const coverPath = getSafeQuestCoverImageObjectPath(
    quest.cover_image_path,
    access.userId,
    questId
  );

  if (quest.cover_image_path !== null && !coverPath) {
    return { status: "error" };
  }

  const taskImagePaths: string[] = [];

  for (const task of taskImages as OwnedTaskImageRow[]) {
    if (!task || typeof task.id !== "string") {
      return { status: "error" };
    }

    if (task.image_url === null) continue;

    if (typeof task.image_url !== "string") {
      return { status: "error" };
    }

    const imagePath = getSafeQuestImageObjectPath(
      task.image_url,
      access.userId,
      questId,
      task.id
    );

    if (!imagePath) {
      return { status: "error" };
    }

    taskImagePaths.push(imagePath);
  }

  if (
    coverPath &&
    !(await removeCanonicalObject(supabase, questCoverImageBucketName, coverPath))
  ) {
    return { status: "error" };
  }

  for (const imagePath of new Set(taskImagePaths)) {
    if (
      !(await removeCanonicalObject(supabase, questImageBucketName, imagePath))
    ) {
      return { status: "error" };
    }
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

  return { status: "ok" };
}
