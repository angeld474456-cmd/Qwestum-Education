import { NextResponse } from "next/server";

import {
  createQuestCoverImageObjectPath,
  getQuestCoverImageExtension,
  getQuestCoverImagePublicUrl,
  getSafeQuestCoverImageObjectPath,
  questCoverImageBucketName,
  questCoverImageMaxFileSize,
} from "@/lib/storage/quest-cover.server";
import { createClient } from "@/lib/supabase/server";
import {
  clearOwnedQuestCoverImage,
  setOwnedQuestCoverImage,
} from "@/services/teacher-quest-cover-mutation.server";
import { getTeacherAuthoringAccess } from "@/services/teacher-authoring-access.server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OwnedQuestCover = {
  id: string;
  cover_image_path: string | null;
};

async function requireMediaAuthoringAccess() {
  return getTeacherAuthoringAccess();
}

async function removeCoverObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectPath: string
) {
  try {
    const { error } = await supabase.storage
      .from(questCoverImageBucketName)
      .remove([objectPath]);

    return error;
  } catch {
    return new Error("Cover Storage cleanup threw.");
  }
}

async function getOwnedQuestCover(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questId: string,
  userId: string
) {
  return supabase
    .from("quests")
    .select("id, cover_image_path")
    .eq("id", questId)
    .eq("author_id", userId)
    .maybeSingle<OwnedQuestCover>();
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
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

  const { data: quest, error: questError } = await getOwnedQuestCover(
    supabase,
    id,
    access.userId
  );

  if (questError) {
    console.error("Cover upload quest ownership check failed.", {
      questId: id,
      error: questError.message,
    });
    return NextResponse.json(
      { error: "Unable to upload cover image." },
      { status: 500 }
    );
  }

  if (!quest) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
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

  if (file.size > questCoverImageMaxFileSize) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller." },
      { status: 413 }
    );
  }

  const extension = getQuestCoverImageExtension(file.type);

  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are supported." },
      { status: 415 }
    );
  }

  const objectPath = createQuestCoverImageObjectPath(
    access.userId,
    id,
    extension
  );

  const { error: uploadError } = await supabase.storage
    .from(questCoverImageBucketName)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Quest cover upload failed.", {
      questId: id,
      error: uploadError.message,
    });
    return NextResponse.json(
      { error: "Unable to upload cover image." },
      { status: 500 }
    );
  }

  const result = await setOwnedQuestCoverImage({
    questId: id,
    expectedCoverImagePath: quest.cover_image_path,
    newObjectPath: objectPath,
  });

  if (result.status === "unauthorized") {
    await removeCoverObject(supabase, objectPath);
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    await removeCoverObject(supabase, objectPath);
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  if (result.status === "stale_cover") {
    const cleanupError = await removeCoverObject(supabase, objectPath);
    if (cleanupError) {
      console.warn("Quest cover cleanup failed after replacement conflict.", {
        questId: id,
        error: cleanupError.message,
      });
    }
    return NextResponse.json(
      { error: "Quest cover changed. Refresh and try again." },
      { status: 409 }
    );
  }

  if (result.status === "error") {
    const cleanupError = await removeCoverObject(supabase, objectPath);
    if (cleanupError) {
      console.warn("Quest cover cleanup failed after DB update error.", {
        questId: id,
        error: cleanupError.message,
      });
    }
    return NextResponse.json(
      { error: "Unable to save cover image." },
      { status: 500 }
    );
  }

  if (result.status === "already_current") {
    return NextResponse.json({
      cover_image_path: result.coverImagePath,
      cover_image_url: getQuestCoverImagePublicUrl(result.coverImagePath),
    });
  }

  if (result.status !== "updated") {
    return NextResponse.json(
      { error: "Unable to save cover image." },
      { status: 500 }
    );
  }

  const previousObjectPath = getSafeQuestCoverImageObjectPath(
    result.previousCoverImagePath,
    access.userId,
    id
  );

  if (previousObjectPath && previousObjectPath !== objectPath) {
    const cleanupError = await removeCoverObject(supabase, previousObjectPath);

    if (cleanupError) {
      console.warn("Quest cover cleanup failed after replacement.", {
        questId: id,
        error: cleanupError.message,
      });
    }
  }

  return NextResponse.json({
    cover_image_path: result.coverImagePath,
    cover_image_url: getQuestCoverImagePublicUrl(result.coverImagePath),
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
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

  const { data: quest, error: questError } = await getOwnedQuestCover(
    supabase,
    id,
    access.userId
  );

  if (questError) {
    console.error("Cover removal quest ownership check failed.", {
      questId: id,
      error: questError.message,
    });
    return NextResponse.json(
      { error: "Unable to remove cover image." },
      { status: 500 }
    );
  }

  if (!quest) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  const result = await clearOwnedQuestCoverImage({
    questId: id,
    expectedCoverImagePath: quest.cover_image_path,
  });

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  if (result.status === "stale_cover") {
    return NextResponse.json(
      { error: "Quest cover changed. Refresh and try again." },
      { status: 409 }
    );
  }

  if (result.status === "error") {
    return NextResponse.json(
      { error: "Unable to remove cover image." },
      { status: 500 }
    );
  }

  if (result.status !== "cleared" && result.status !== "already_clear") {
    return NextResponse.json(
      { error: "Unable to remove cover image." },
      { status: 500 }
    );
  }

  const objectPath = getSafeQuestCoverImageObjectPath(
    result.previousCoverImagePath,
    access.userId,
    id
  );

  if (!objectPath) {
    return NextResponse.json({
      success: true,
      cover_image_path: null,
      cover_image_url: null,
      storageDeleted: false,
    });
  }

  const deleteError = await removeCoverObject(supabase, objectPath);

  if (deleteError) {
    console.warn("Quest cover cleanup failed after DB removal.", {
      questId: id,
      error: deleteError.message,
    });
    return NextResponse.json({
      success: true,
      cover_image_path: null,
      cover_image_url: null,
      storageDeleted: false,
    });
  }

  return NextResponse.json({
    success: true,
    cover_image_path: null,
    cover_image_url: null,
    storageDeleted: true,
  });
}
