import { NextResponse } from "next/server";

import {
  getSafeQuestImageObjectPath,
  questImageBucketName,
} from "@/lib/storage/quest-image.server";
import { createClient } from "@/lib/supabase/server";
import {
  clearOwnedQuestTaskImage,
  setOwnedQuestTaskImage,
} from "@/services/teacher-task-image-mutation.server";
import { getTeacherAuthoringAccess } from "@/services/teacher-authoring-access.server";

const maxFileSize = 5 * 1024 * 1024;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedMimeTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type RouteContext = {
  params: Promise<{
    id: string;
    taskId: string;
  }>;
};

type OwnedTask = {
  id: string;
};

async function requireMediaAuthoringAccess() {
  return getTeacherAuthoringAccess();
}

async function removeObjectPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectPath: string
) {
  try {
    const { error } = await supabase.storage
      .from(questImageBucketName)
      .remove([objectPath]);

    return !error;
  } catch {
    return false;
  }
}

async function removeCanonicalImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imageUrl: string,
  userId: string,
  questId: string,
  taskId: string
) {
  try {
    const objectPath = getSafeQuestImageObjectPath(
      imageUrl,
      userId,
      questId,
      taskId
    );

    return objectPath ? await removeObjectPath(supabase, objectPath) : false;
  } catch {
    return false;
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id, taskId } = await params;

  if (!uuidPattern.test(id) || !uuidPattern.test(taskId)) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const access = await requireMediaAuthoringAccess();

  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (access.status !== "allowed") {
    return NextResponse.json(
      { error: "Authoring access unavailable." },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  const { data: ownedQuest, error: ownedQuestError } = await supabase
    .from("quests")
    .select("id")
    .eq("id", id)
    .eq("author_id", access.userId)
    .maybeSingle();

  if (ownedQuestError) {
    console.error("Image upload quest ownership check failed.", {
      questId: id,
      error: ownedQuestError.message,
    });
    return NextResponse.json(
      { error: "Unable to upload image." },
      { status: 500 }
    );
  }

  if (!ownedQuest) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const { data: task, error: taskError } = await supabase
    .from("quest_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("quest_id", id)
    .maybeSingle<OwnedTask>();

  if (taskError) {
    console.error("Image upload task relation check failed.", {
      questId: id,
      taskId,
      error: taskError.message,
    });
    return NextResponse.json(
      { error: "Unable to upload image." },
      { status: 500 }
    );
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid upload payload." },
      { status: 400 }
    );
  }

  const entries = Array.from(formData.entries());

  if (
    entries.length !== 2 ||
    !entries.some(([key]) => key === "file") ||
    !entries.some(([key]) => key === "expectedImageUrl")
  ) {
    return NextResponse.json(
      { error: "Upload must include exactly one file." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const expectedImageUrlValue = formData.get("expectedImageUrl");

  if (typeof expectedImageUrlValue !== "string") {
    return NextResponse.json(
      { error: "Invalid upload payload." },
      { status: 400 }
    );
  }

  const expectedImageUrl = expectedImageUrlValue || null;

  if (
    expectedImageUrl &&
    !getSafeQuestImageObjectPath(expectedImageUrl, access.userId, id, taskId)
  ) {
    return NextResponse.json(
      { error: "Invalid upload payload." },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload must include an image file." },
      { status: 400 }
    );
  }

  if (file.size <= 0) {
    return NextResponse.json(
      { error: "Image file is empty." },
      { status: 400 }
    );
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller." },
      { status: 413 }
    );
  }

  const extension = allowedMimeTypes[file.type];

  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are supported." },
      { status: 415 }
    );
  }

  const objectPath = `teachers/${access.userId}/quests/${id}/tasks/${taskId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(questImageBucketName)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Quest image upload failed.", {
      questId: id,
      taskId,
      error: uploadError.message,
    });
    return NextResponse.json(
      { error: "Unable to upload image." },
      { status: 500 }
    );
  }

  const result = await setOwnedQuestTaskImage({
    questId: id,
    taskId,
    expectedImageUrl,
    newObjectPath: objectPath,
  });

  if (result.status === "updated") {
    const storageDeleted = result.previousImageUrl
      ? await removeCanonicalImage(
          supabase,
          result.previousImageUrl,
          access.userId,
          id,
          taskId
        )
      : false;

    return NextResponse.json({
      imageUrl: result.imageUrl,
      storageDeleted,
    });
  }

  await removeObjectPath(supabase, objectPath);

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "stale_image") {
    return NextResponse.json(
      { error: "Task image changed. Refresh and try again." },
      { status: 409 }
    );
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Unable to upload image." },
    { status: 500 }
  );
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id, taskId } = await params;

  if (!uuidPattern.test(id) || !uuidPattern.test(taskId)) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const access = await requireMediaAuthoringAccess();

  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (access.status !== "allowed") {
    return NextResponse.json(
      { error: "Authoring access unavailable." },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid image request." },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    typeof (body as { expectedImageUrl?: unknown }).expectedImageUrl !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid image request." },
      { status: 400 }
    );
  }

  const expectedImageUrl = (body as { expectedImageUrl: string }).expectedImageUrl;

  if (!getSafeQuestImageObjectPath(expectedImageUrl, access.userId, id, taskId)) {
    return NextResponse.json(
      { error: "Invalid image request." },
      { status: 400 }
    );
  }

  const { data: ownedQuest, error: ownedQuestError } = await supabase
    .from("quests")
    .select("id")
    .eq("id", id)
    .eq("author_id", access.userId)
    .maybeSingle();

  if (ownedQuestError) {
    console.error("Image removal quest ownership check failed.", {
      questId: id,
      error: ownedQuestError.message,
    });
    return NextResponse.json(
      { error: "Unable to remove image." },
      { status: 500 }
    );
  }

  if (!ownedQuest) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const { data: task, error: taskError } = await supabase
    .from("quest_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("quest_id", id)
    .maybeSingle<OwnedTask>();

  if (taskError) {
    console.error("Image removal task relation check failed.", {
      questId: id,
      taskId,
      error: taskError.message,
    });
    return NextResponse.json(
      { error: "Unable to remove image." },
      { status: 500 }
    );
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const result = await clearOwnedQuestTaskImage({
    questId: id,
    taskId,
    expectedImageUrl,
  });

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "stale_image") {
    return NextResponse.json(
      { error: "Task image changed. Refresh and try again." },
      { status: 409 }
    );
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  if (result.status !== "cleared") {
    return NextResponse.json(
      { error: "Unable to remove image." },
      { status: 500 }
    );
  }

  const storageDeleted = result.previousImageUrl
    ? await removeCanonicalImage(
        supabase,
        result.previousImageUrl,
        access.userId,
        id,
        taskId
      )
    : false;

  return NextResponse.json({
    success: true,
    imageUrl: null,
    storageDeleted,
  });
}
