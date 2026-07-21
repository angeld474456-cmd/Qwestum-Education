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
  subject_id?: unknown;
  grade_min?: unknown;
  grade_max?: unknown;
  estimated_duration_minutes?: unknown;
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

type NullableIntegerFieldResult =
  | {
      provided: false;
      value?: never;
      error?: never;
    }
  | {
      provided: true;
      value: number | null;
      error?: never;
    }
  | {
      provided: true;
      value?: never;
      error: string;
    };

function parseNullableIntegerField(
  body: QuestPayload,
  fieldName: keyof QuestPayload,
  label: string,
  min: number,
  max: number
): NullableIntegerFieldResult {
  if (!(fieldName in body)) {
    return {
      provided: false,
    };
  }

  const value = body[fieldName];

  if (value === null || value === "") {
    return {
      provided: true,
      value: null,
    };
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return {
      provided: true,
      error: `${label} must be an integer.`,
    };
  }

  if (value < min || value > max) {
    return {
      provided: true,
      error: `${label} must be between ${min} and ${max}.`,
    };
  }

  return {
    provided: true,
    value,
  };
}

type SubjectIdFieldResult =
  | {
      provided: false;
      value?: never;
      error?: never;
    }
  | {
      provided: true;
      value: string | null;
      error?: never;
    }
  | {
      provided: true;
      value?: never;
      error: string;
    };

function parseSubjectIdField(body: QuestPayload): SubjectIdFieldResult {
  if (!("subject_id" in body)) {
    return {
      provided: false,
    };
  }

  if (body.subject_id === null || body.subject_id === "") {
    return {
      provided: true,
      value: null,
    };
  }

  if (
    typeof body.subject_id !== "string" ||
    !uuidPattern.test(body.subject_id)
  ) {
    return {
      provided: true,
      error: "Subject is invalid.",
    };
  }

  return {
    provided: true,
    value: body.subject_id,
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

  const gradeMin = parseNullableIntegerField(
    body,
    "grade_min",
    "Grade from",
    1,
    11
  );
  const gradeMax = parseNullableIntegerField(
    body,
    "grade_max",
    "Grade to",
    1,
    11
  );
  const estimatedDuration = parseNullableIntegerField(
    body,
    "estimated_duration_minutes",
    "Estimated duration",
    5,
    240
  );
  const subjectId = parseSubjectIdField(body);

  if (gradeMin.error) {
    return NextResponse.json({ error: gradeMin.error }, { status: 400 });
  }

  if (gradeMax.error) {
    return NextResponse.json({ error: gradeMax.error }, { status: 400 });
  }

  if (estimatedDuration.error) {
    return NextResponse.json(
      { error: estimatedDuration.error },
      { status: 400 }
    );
  }

  if (subjectId.error) {
    return NextResponse.json({ error: subjectId.error }, { status: 400 });
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
    .select("id, grade_min, grade_max")
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

  if (subjectId.provided && subjectId.value !== null) {
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId.value)
      .maybeSingle();

    if (subjectError) {
      console.error(subjectError);
      return NextResponse.json(
        { error: "Unable to save quest settings." },
        { status: 500 }
      );
    }

    if (!subject) {
      return NextResponse.json({ error: "Subject is invalid." }, { status: 400 });
    }
  }

  const finalGradeMin = gradeMin.provided
    ? gradeMin.value
    : ownedQuest.grade_min;
  const finalGradeMax = gradeMax.provided
    ? gradeMax.value
    : ownedQuest.grade_max;

  const hasGradeMin = finalGradeMin !== null;
  const hasGradeMax = finalGradeMax !== null;

  if (hasGradeMin !== hasGradeMax) {
    return NextResponse.json(
      { error: "Grade range must include both Grade from and Grade to." },
      { status: 400 }
    );
  }

  if (
    finalGradeMin !== null &&
    finalGradeMax !== null &&
    finalGradeMin > finalGradeMax
  ) {
    return NextResponse.json(
      { error: "Grade from must be less than or equal to Grade to." },
      { status: 400 }
    );
  }

  const updateData = {
    ...parsed.data,
    ...(subjectId.provided ? { subject_id: subjectId.value } : {}),
    ...(gradeMin.provided ? { grade_min: gradeMin.value } : {}),
    ...(gradeMax.provided ? { grade_max: gradeMax.value } : {}),
    ...(estimatedDuration.provided
      ? { estimated_duration_minutes: estimatedDuration.value }
      : {}),
  };

  const { data, error } = await supabase
    .from("quests")
    .update(updateData)
    .eq("id", id)
    .eq("author_id", user.id)
    .select(
      "id, title, description, subject_id, difficulty, is_public, grade_min, grade_max, estimated_duration_minutes"
    )
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
