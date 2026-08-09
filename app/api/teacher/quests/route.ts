import { NextResponse } from "next/server";

import { createOwnedQuest } from "@/services/teacher-quest-creation.server";

const allowedDifficulties = new Set([1, 2, 3]);

type QuestPayload = {
  title?: unknown;
  description?: unknown;
  difficulty?: unknown;
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

  return {
    data: {
      title,
      description,
      difficulty,
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

  const result = await createOwnedQuest(parsed.data);

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status !== "ok") {
    return NextResponse.json(
      { error: "Unable to create quest." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    quest: {
      id: result.id,
    },
  });
}
