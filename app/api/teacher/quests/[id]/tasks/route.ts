import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const allowedTaskTypes = new Set(["text", "single_choice"]);
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

  return {
    data: {
      title,
      description,
      answer,
      hint,
      points,
      task_type: body.task_type,
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
    .order("sort_order");

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
      { error: "Unable to create task." },
      { status: 500 }
    );
  }

  const { count, error: countError } = await supabase
    .from("quest_tasks")
    .select("id", { count: "exact", head: true })
    .eq("quest_id", id);

  if (countError) {
    console.error(countError);
    return NextResponse.json(
      { error: "Unable to create task." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("quest_tasks")
    .insert({
      quest_id: id,
      title: parsed.data.title,
      description: parsed.data.description,
      answer: parsed.data.answer,
      hint: parsed.data.hint,
      image_url: "",
      video_url: "",
      audio_url: "",
      points: parsed.data.points,
      task_type: parsed.data.task_type,
      sort_order: (count ?? 0) + 1,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to create task." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    task: data,
  });
}
