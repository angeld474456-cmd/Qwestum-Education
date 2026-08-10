import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { parseMultipleChoiceContent } from "@/lib/multiple-choice";
import { createOwnedQuestTask } from "@/services/teacher-task-creation.server";

const allowedTaskTypes = new Set(["text", "single_choice", "multiple_choice"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreateTaskPayload = {
  title?: unknown;
  description?: unknown;
  answer?: unknown;
  hint?: unknown;
  points?: unknown;
  task_type?: unknown;
  content?: unknown;
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
    .select("id")
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
  };
}

function parseCreateTaskPayload(body: CreateTaskPayload) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const hint = typeof body.hint === "string" ? body.hint.trim() : "";
  const points = body.points;

  if (!title) {
    return {
      error: "Title is required.",
    };
  }

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

  if (
    typeof body.task_type !== "string" ||
    !allowedTaskTypes.has(body.task_type)
  ) {
    return {
      error: "Task type is not supported.",
    };
  }

  const content =
    body.task_type === "multiple_choice"
      ? parseMultipleChoiceContent(body.content)
      : undefined;

  if (body.task_type === "multiple_choice" && !content) {
    return { error: "Multiple Choice content is invalid." };
  }

  return {
    data: {
      title,
      description,
      answer,
      hint,
      points,
      task_type: body.task_type,
      ...(content ? { content } : {}),
    },
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const ownedQuest = await getOwnedQuest(supabase, id);

  if (ownedQuest.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (ownedQuest.status === "not_found") {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  if (ownedQuest.status === "error") {
    return NextResponse.json(
      { error: "Unable to load tasks." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("quest_tasks")
    .select("*")
    .eq("quest_id", id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to load tasks." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    tasks: data ?? [],
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  let body: CreateTaskPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const parsed = parseCreateTaskPayload(body);

  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!parsed.data) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await createOwnedQuestTask({
    questId: id,
    title: parsed.data.title,
    description: parsed.data.description,
    answer: parsed.data.answer,
    hint: parsed.data.hint,
    points: parsed.data.points,
    taskType: parsed.data.task_type,
    content: parsed.data.content ?? null,
  });

  if (result.status === "ok") {
    return NextResponse.json({ task: result.task });
  }

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  if (result.status === "task_limit_reached") {
    return NextResponse.json({ error: "Task limit reached." }, { status: 409 });
  }

  return NextResponse.json(
    { error: "Unable to create task." },
    { status: 500 }
  );
}
