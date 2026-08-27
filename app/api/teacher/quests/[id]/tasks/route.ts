import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  classifyMultipleChoiceContent,
  classifySingleChoiceContent,
} from "@/lib/task-choice-content";
import { MAX_TASK_POINTS } from "@/lib/task-points";
import { parseSequenceTaskContent } from "@/lib/sequence-task-content";
import { createOwnedQuestTask } from "@/services/teacher-task-creation.server";

const allowedTaskTypes = new Set(["text", "single_choice", "multiple_choice", "sequence"]);
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

  if (!title || title.length > 500) {
    return {
      error: "Title is required.",
    };
  }

  if (
    typeof points !== "number" ||
    !Number.isFinite(points) ||
    !Number.isSafeInteger(points) ||
    points < 1 ||
    points > MAX_TASK_POINTS
  ) {
    return {
      error: "Points must be a positive integer.",
    };
  }

  if (description.length > 10000) {
    return { error: "Description is too long." };
  }

  if (
    typeof body.task_type !== "string" ||
    !allowedTaskTypes.has(body.task_type)
  ) {
    return {
      error: "Task type is not supported.",
    };
  }

  if (
    body.content !== undefined &&
    body.content !== null &&
    (typeof body.content !== "object" || Array.isArray(body.content))
  ) {
    return { error: "Content must be an object or null." };
  }

  const content = body.content === undefined || body.content === null
    ? null
    : body.content as Record<string, unknown>;

  if (body.task_type === "text" && content !== null) {
    return { error: "Text content is not supported." };
  }

  if (body.task_type === "single_choice") {
    const choiceContent = classifySingleChoiceContent(content);
    if (choiceContent.state === "malformed") {
      return { error: "Single Choice content is invalid." };
    }
  }

  if (body.task_type === "multiple_choice") {
    const choiceContent = classifyMultipleChoiceContent(content);
    if (choiceContent.state === "malformed") {
      return { error: "Multiple Choice content is invalid." };
    }
  }

  if (body.task_type === "sequence" && content !== null && !parseSequenceTaskContent(content)) {
    return { error: "Sequence content is invalid." };
  }

  return {
    data: {
      title,
      description,
      answer,
      hint,
      points,
      task_type: body.task_type,
      content,
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
