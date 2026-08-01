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

type OwnedQuest = {
  id: string;
  cover_image_path: string | null;
};

type OwnedQuestTask = {
  id: string;
  image_url: string | null;
};

export type DeleteOwnedQuestResult =
  | { status: "ok" }
  | { status: "unauthorized" | "not_found" | "error" };

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

  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select("id, cover_image_path")
    .eq("id", questId)
    .eq("author_id", user.id)
    .maybeSingle<OwnedQuest>();

  if (questError) {
    return { status: "error" };
  }

  if (!quest) {
    return { status: "not_found" };
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("quest_tasks")
    .select("id, image_url")
    .eq("quest_id", questId);

  if (tasksError) {
    return { status: "error" };
  }

  const { data: deletedQuest, error: deleteError } = await supabase
    .from("quests")
    .delete()
    .eq("id", questId)
    .eq("author_id", user.id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    return { status: "error" };
  }

  if (!deletedQuest) {
    return { status: "not_found" };
  }

  const coverPath = getSafeQuestCoverImageObjectPath(
    quest.cover_image_path,
    user.id,
    questId
  );
  const taskImagePaths = new Set<string>();

  for (const task of (tasks ?? []) as OwnedQuestTask[]) {
    const imagePath = getSafeQuestImageObjectPath(
      task.image_url ?? "",
      user.id,
      questId,
      task.id
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
