import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const allowedDifficulties = new Set([1, 2, 3]);

type QuestPayload = {
  title?: unknown;
  description?: unknown;
  difficulty?: unknown;
  is_public?: unknown;
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

export async function POST(request: Request) {
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

  const { data, error } = await supabase
    .from("quests")
    .insert({
      ...parsed.data,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to create quest." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    quest: {
      id: data.id,
    },
  });
}
