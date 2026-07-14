import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const allowedDifficulties = new Set([1, 2, 3]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type QuestPayload = {
  title?: unknown;
  description?: unknown;
  difficulty?: unknown;
  is_public?: unknown;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseQuestPayload(body: QuestPayload) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const difficulty = Number(body.difficulty);

  if (!title) {
    return {
      error: "Title is required.",
    };
  }

  if (!Number.isFinite(difficulty) || !allowedDifficulties.has(difficulty)) {
    return {
      error: "Difficulty must be 1, 2, or 3.",
    };
  }

  if (typeof body.is_public !== "boolean") {
    return {
      error: "Publication state must be true or false.",
    };
  }

  return {
    data: {
      title,
      description,
      difficulty,
      is_public: body.is_public,
    },
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  let body: QuestPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const parsed = parseQuestPayload(body);

  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!parsed.data) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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
    console.error(ownedQuestError);
    return NextResponse.json(
      { error: "Unable to save quest settings." },
      { status: 500 }
    );
  }

  if (!ownedQuest) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("quests")
    .update(parsed.data)
    .eq("id", id)
    .eq("author_id", user.id)
    .select("id, title, description, difficulty, is_public")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to save quest settings." },
      { status: 500 }
    );
  }

  if (!data) {
    console.error(
      "Owned quest update returned no row. Check quests UPDATE RLS policy.",
      { questId: id }
    );
    return NextResponse.json(
      { error: "Unable to save quest settings." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    quest: data,
  });
}
