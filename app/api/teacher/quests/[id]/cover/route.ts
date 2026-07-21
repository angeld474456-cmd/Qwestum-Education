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

async function removeCoverObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectPath: string
) {
  const { error } = await supabase.storage
    .from(questCoverImageBucketName)
    .remove([objectPath]);

  return error;
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: quest, error: questError } = await getOwnedQuestCover(
    supabase,
    id,
    user.id
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
    user.id,
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

  let updateQuery = supabase
    .from("quests")
    .update({ cover_image_path: objectPath })
    .eq("id", id)
    .eq("author_id", user.id);

  updateQuery = quest.cover_image_path
    ? updateQuery.eq("cover_image_path", quest.cover_image_path)
    : updateQuery.is("cover_image_path", null);

  const { data: updatedQuest, error: updateError } = await updateQuery
    .select("id, cover_image_path")
    .maybeSingle<OwnedQuestCover>();

  if (updateError) {
    console.error("Quest cover path update failed.", {
      questId: id,
      error: updateError.message,
    });
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

  if (!updatedQuest) {
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

  const previousObjectPath = getSafeQuestCoverImageObjectPath(
    quest.cover_image_path,
    user.id,
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
    cover_image_path: updatedQuest.cover_image_path,
    cover_image_url: getQuestCoverImagePublicUrl(updatedQuest.cover_image_path),
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: quest, error: questError } = await getOwnedQuestCover(
    supabase,
    id,
    user.id
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

  if (!quest.cover_image_path) {
    return NextResponse.json({
      success: true,
      cover_image_path: null,
      cover_image_url: null,
      storageDeleted: false,
    });
  }

  const updateQuery = supabase
    .from("quests")
    .update({ cover_image_path: null })
    .eq("id", id)
    .eq("author_id", user.id)
    .eq("cover_image_path", quest.cover_image_path);

  const { data: updatedQuest, error: updateError } = await updateQuery
    .select("id, cover_image_path")
    .maybeSingle<OwnedQuestCover>();

  if (updateError) {
    console.error("Quest cover path removal failed.", {
      questId: id,
      error: updateError.message,
    });
    return NextResponse.json(
      { error: "Unable to remove cover image." },
      { status: 500 }
    );
  }

  if (!updatedQuest) {
    return NextResponse.json(
      { error: "Quest cover changed. Refresh and try again." },
      { status: 409 }
    );
  }

  const objectPath = getSafeQuestCoverImageObjectPath(
    quest.cover_image_path,
    user.id,
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
