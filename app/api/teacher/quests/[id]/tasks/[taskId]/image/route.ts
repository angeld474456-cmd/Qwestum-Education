import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const bucketName = "quest-images";
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
  image_url: string | null;
};

function getSafeObjectPath(
  imageUrl: string,
  userId: string,
  questId: string,
  taskId: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return null;

  try {
    const publicUrl = new URL(imageUrl);
    const projectUrl = new URL(supabaseUrl);

    if (publicUrl.origin !== projectUrl.origin) return null;

    const publicPrefix = `/storage/v1/object/public/${bucketName}/`;

    if (!publicUrl.pathname.startsWith(publicPrefix)) return null;

    const objectPath = decodeURIComponent(
      publicUrl.pathname.slice(publicPrefix.length)
    );
    const segments = objectPath.split("/");

    if (segments.length !== 7) return null;
    if (segments[0] !== "teachers") return null;
    if (segments[1] !== userId) return null;
    if (segments[2] !== "quests") return null;
    if (segments[3] !== questId) return null;
    if (segments[4] !== "tasks") return null;
    if (segments[5] !== taskId) return null;
    if (!segments[6]) return null;

    return objectPath;
  } catch {
    return null;
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id, taskId } = await params;

  if (!uuidPattern.test(id) || !uuidPattern.test(taskId)) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: ownedQuest, error: ownedQuestError } = await supabase
    .from("quests")
    .select("id")
    .eq("id", id)
    .eq("author_id", user.id)
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
    .maybeSingle();

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

  if (entries.length !== 1 || entries[0][0] !== "file") {
    return NextResponse.json(
      { error: "Upload must include exactly one file." },
      { status: 400 }
    );
  }

  const file = entries[0][1];

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

  const objectPath = `teachers/${user.id}/quests/${id}/tasks/${taskId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
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

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(objectPath);

  return NextResponse.json({
    imageUrl: data.publicUrl,
    objectPath,
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id, taskId } = await params;

  if (!uuidPattern.test(id) || !uuidPattern.test(taskId)) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: ownedQuest, error: ownedQuestError } = await supabase
    .from("quests")
    .select("id")
    .eq("id", id)
    .eq("author_id", user.id)
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
    .select("id, image_url")
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

  if (!task.image_url) {
    return NextResponse.json({
      success: true,
      imageUrl: null,
      storageDeleted: false,
    });
  }

  const objectPath = getSafeObjectPath(task.image_url, user.id, id, taskId);

  const { data: updatedTask, error: updateError } = await supabase
    .from("quest_tasks")
    .update({ image_url: null })
    .eq("id", taskId)
    .eq("quest_id", id)
    .eq("image_url", task.image_url)
    .select("*")
    .maybeSingle();

  if (updateError) {
    console.error("Image removal task update failed.", {
      questId: id,
      taskId,
      error: updateError.message,
    });
    return NextResponse.json(
      { error: "Unable to remove image." },
      { status: 500 }
    );
  }

  if (!updatedTask) {
    return NextResponse.json(
      { error: "Task image changed. Refresh and try again." },
      { status: 409 }
    );
  }

  if (!objectPath) {
    return NextResponse.json({
      success: true,
      imageUrl: null,
      storageDeleted: false,
      task: updatedTask,
    });
  }

  const { error: deleteError } = await supabase.storage
    .from(bucketName)
    .remove([objectPath]);

  if (deleteError) {
    console.warn("Quest image cleanup failed after DB removal.", {
      questId: id,
      taskId,
      error: deleteError.message,
    });
    return NextResponse.json({
      success: true,
      imageUrl: null,
      storageDeleted: false,
      task: updatedTask,
    });
  }

  return NextResponse.json({
    success: true,
    imageUrl: null,
    storageDeleted: true,
    task: updatedTask,
  });
}
