import { NextResponse } from "next/server";

import {
  getSafeQuestImageObjectPath,
  questImageBucketName,
} from "@/lib/storage/quest-image.server";
import { createClient } from "@/lib/supabase/server";
import { parseMultipleChoiceContent } from "@/lib/multiple-choice";
import { deleteOwnedQuestTask } from "@/services/teacher-task-deletion.server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{
    id: string;
    taskId: string;
  }>;
};

type UpdateTaskPayload = {
  title?: unknown;
  description?: unknown;
  points?: unknown;
  content?: unknown;
  image_url?: unknown;
};

type OwnedTaskImage = {
  id: string;
  image_url: string | null;
  task_type: string;
};

async function getOwnedQuest(supabase: Awaited<ReturnType<typeof createClient>>, questId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "unauthorized" as const,
    };
  }

  const { data, error } = await supabase
    .from("quests")
    .select("id, is_public")
    .eq("id", questId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return {
      status: "error" as const,
    };
  }

  if (!data) {
    return {
      status: "not_found" as const,
    };
  }

  return {
    status: "ok" as const,
    userId: user.id,
    isPublic: data.is_public,
  };
}

function parseUpdateTaskPayload(body: UpdateTaskPayload) {
  const updates: Record<string, unknown> = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return {
        error: "Title is required.",
      };
    }

    updates.title = body.title.trim();
  }

  if ("description" in body) {
    if (typeof body.description !== "string") {
      return {
        error: "Description must be text.",
      };
    }

    updates.description = body.description.trim();
  }

  if ("points" in body) {
    const points = body.points;

    if (
      typeof points !== "number" ||
      !Number.isFinite(points) ||
      !Number.isSafeInteger(points) ||
      points < 1
    ) {
      return {
        error: "Points must be a positive integer.",
      };
    }

    updates.points = points;
  }

  if ("content" in body) {
    if (
      body.content !== null &&
      (typeof body.content !== "object" || Array.isArray(body.content))
    ) {
      return {
        error: "Content must be an object or null.",
      };
    }

    updates.content = body.content;
  }

  if ("image_url" in body) {
    if (typeof body.image_url !== "string" && body.image_url !== null) {
      return {
        error: "Image URL must be text or null.",
      };
    }

    updates.image_url = body.image_url;
  }

  if (Object.keys(updates).length === 0) {
    return {
      error: "No editable fields provided.",
    };
  }

  return {
    data: updates,
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, taskId } = await params;

  if (!uuidPattern.test(id) || !uuidPattern.test(taskId)) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  let body: UpdateTaskPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const parsed = parseUpdateTaskPayload(body);

  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!parsed.data) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();
  const ownedQuest = await getOwnedQuest(supabase, id);

  if (ownedQuest.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (ownedQuest.status === "not_found") {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  if (ownedQuest.status === "error") {
    return NextResponse.json(
      { error: "Unable to save task." },
      { status: 500 }
    );
  }

  let previousImageUrl: string | null = null;
  const isImageUrlUpdate = "image_url" in parsed.data;
  const isContentUpdate = "content" in parsed.data;

  if (isImageUrlUpdate || isContentUpdate) {
    const { data: currentTask, error: currentTaskError } = await supabase
      .from("quest_tasks")
      .select("id, image_url, task_type")
      .eq("id", taskId)
      .eq("quest_id", id)
      .maybeSingle<OwnedTaskImage>();

    if (currentTaskError) {
      console.error("Task image replacement lookup failed.", {
        questId: id,
        taskId,
        error: currentTaskError.message,
      });
      return NextResponse.json(
        { error: "Unable to save task." },
        { status: 500 }
      );
    }

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    if (
      isContentUpdate &&
      currentTask.task_type === "multiple_choice" &&
      !parseMultipleChoiceContent(parsed.data.content)
    ) {
      return NextResponse.json(
        { error: "Multiple Choice content is invalid." },
        { status: 400 }
      );
    }

    previousImageUrl = currentTask.image_url;
  }

  const { data, error } = await supabase
    .from("quest_tasks")
    .update(parsed.data)
    .eq("id", taskId)
    .eq("quest_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to save task." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  if (
    isImageUrlUpdate &&
    previousImageUrl &&
    previousImageUrl !== data.image_url
  ) {
    const previousObjectPath = getSafeQuestImageObjectPath(
      previousImageUrl,
      ownedQuest.userId,
      id,
      taskId
    );

    if (previousObjectPath) {
      const { error: cleanupError } = await supabase.storage
        .from(questImageBucketName)
        .remove([previousObjectPath]);

      if (cleanupError) {
        console.warn("Quest image cleanup failed after replacement.", {
          questId: id,
          taskId,
          error: cleanupError.message,
        });
      }
    }
  }

  return NextResponse.json({
    task: data,
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id, taskId } = await params;

  if (!uuidPattern.test(id) || !uuidPattern.test(taskId)) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const result = await deleteOwnedQuestTask(id, taskId);

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  if (result.status === "last_public_task") {
    return NextResponse.json(
      {
        error:
          "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u043d\u0438\u043c\u0438\u0442\u0435 \u043a\u0432\u0435\u0441\u0442 \u0441 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438, \u0437\u0430\u0442\u0435\u043c \u0443\u0434\u0430\u043b\u0438\u0442\u0435 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u0437\u0430\u0434\u0430\u043d\u0438\u0435.",
      },
      { status: 400 }
    );
  }


  if (result.status === "error") {
    return NextResponse.json(
      { error: "Unable to delete task." },
      { status: 500 }
    );
  }

  let storageDeleted = false;

  if (result.imageUrl) {
    try {
      const supabase = await createClient();
      const objectPath = getSafeQuestImageObjectPath(
        result.imageUrl,
        result.userId,
        id,
        taskId
      );

      if (objectPath) {
        const { error: cleanupError } = await supabase.storage
          .from(questImageBucketName)
          .remove([objectPath]);

        storageDeleted = !cleanupError;
      }
    } catch {
      // The database deletion is already final; cleanup remains best-effort.
      storageDeleted = false;
    }
  }

  return NextResponse.json({
    ok: true,
    storageDeleted,
  });
}
