import { NextResponse } from "next/server";

import { deleteOwnedQuest } from "@/services/teacher-quest-deletion.server";
import { getTeacherAuthoringAccess } from "@/services/teacher-authoring-access.server";
import { isQuestLanguageCode } from "@/services/quest-language";
import { updateOwnedQuestMetadata } from "@/services/teacher-quest-metadata-update.server";

const allowedDifficulties = new Set([1, 2, 3]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type QuestPayload = {
  title?: unknown;
  description?: unknown;
  difficulty?: unknown;
  subject_id?: unknown;
  language_code?: unknown;
  category?: unknown;
  tags?: unknown;
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

  return {
    data: {
      title,
      description,
      difficulty,
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

type LanguageCodeFieldResult =
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

function parseLanguageCodeField(body: QuestPayload): LanguageCodeFieldResult {
  if (!("language_code" in body)) {
    return {
      provided: false,
    };
  }

  if (body.language_code === null || body.language_code === "") {
    return {
      provided: true,
      value: null,
    };
  }

  if (!isQuestLanguageCode(body.language_code)) {
    return {
      provided: true,
      error: "Language is invalid.",
    };
  }

  return {
    provided: true,
    value: body.language_code,
  };
}

type OptionalStringFieldResult =
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

type TagsFieldResult =
  | {
      provided: false;
      value?: never;
      error?: never;
    }
  | {
      provided: true;
      value: string[];
      error?: never;
    }
  | {
      provided: true;
      value?: never;
      error: string;
    };

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function parseCategoryField(body: QuestPayload): OptionalStringFieldResult {
  if (!("category" in body)) {
    return {
      provided: false,
    };
  }

  if (body.category === null) {
    return {
      provided: true,
      value: null,
    };
  }

  if (typeof body.category !== "string") {
    return {
      provided: true,
      error: "Category must be a string or null.",
    };
  }

  if (hasControlCharacters(body.category)) {
    return {
      provided: true,
      error: "Category contains unsupported characters.",
    };
  }

  const value = normalizeWhitespace(body.category);

  if (!value) {
    return {
      provided: true,
      value: null,
    };
  }

  if (value.length > 40) {
    return {
      provided: true,
      error: "Category must be 40 characters or fewer.",
    };
  }

  return {
    provided: true,
    value,
  };
}

function parseTagsField(body: QuestPayload): TagsFieldResult {
  if (!("tags" in body)) {
    return {
      provided: false,
    };
  }

  if (!Array.isArray(body.tags)) {
    return {
      provided: true,
      error: "Tags must be an array of strings.",
    };
  }

  const dedupeKeys = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of body.tags) {
    if (typeof rawTag !== "string") {
      return {
        provided: true,
        error: "Tags must be an array of strings.",
      };
    }

    if (hasControlCharacters(rawTag)) {
      return {
        provided: true,
        error: "A tag contains unsupported characters.",
      };
    }

    const tag = normalizeWhitespace(rawTag);

    if (!tag) continue;

    if (tag.length > 24) {
      return {
        provided: true,
        error: "A tag must be 24 characters or fewer.",
      };
    }

    const key = tag.toLowerCase();

    if (dedupeKeys.has(key)) continue;

    dedupeKeys.add(key);
    tags.push(tag);
  }

  if (tags.length > 10) {
    return {
      provided: true,
      error: "A maximum of 10 tags is allowed.",
    };
  }

  return {
    provided: true,
    value: tags,
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

  if (
    typeof body === "object" &&
    body !== null &&
    Object.prototype.propertyIsEnumerable.call(body, "is_public")
  ) {
    return NextResponse.json(
      { error: "Publication state must be changed through the publication action." },
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
  const languageCode = parseLanguageCodeField(body);
  const category = parseCategoryField(body);
  const tags = parseTagsField(body);

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

  if (gradeMin.provided && gradeMax.provided) {
    const providedGradeMin = gradeMin.value;
    const providedGradeMax = gradeMax.value;

    if (
      typeof providedGradeMin === "number" &&
      typeof providedGradeMax === "number" &&
      providedGradeMin > providedGradeMax
    ) {
      return NextResponse.json(
        { error: "Grade from must be less than or equal to Grade to." },
        { status: 400 }
      );
    }
  }

  if (subjectId.error) {
    return NextResponse.json({ error: subjectId.error }, { status: 400 });
  }

  if (languageCode.error) {
    return NextResponse.json({ error: languageCode.error }, { status: 400 });
  }

  if (category.error) {
    return NextResponse.json({ error: category.error }, { status: 400 });
  }

  if (tags.error) {
    return NextResponse.json({ error: tags.error }, { status: 400 });
  }

  const result = await updateOwnedQuestMetadata({
    questId: id,
    ...parsed.data,
    subjectId: {
      provided: subjectId.provided,
      value: subjectId.provided ? subjectId.value ?? null : null,
    },
    languageCode: {
      provided: languageCode.provided,
      value: languageCode.provided ? languageCode.value ?? null : null,
    },
    category: {
      provided: category.provided,
      value: category.provided ? category.value ?? null : null,
    },
    tags: {
      provided: tags.provided,
      value: tags.provided ? tags.value ?? [] : [],
    },
    gradeMin: {
      provided: gradeMin.provided,
      value: gradeMin.provided ? gradeMin.value ?? null : null,
    },
    gradeMax: {
      provided: gradeMax.provided,
      value: gradeMax.provided ? gradeMax.value ?? null : null,
    },
    estimatedDurationMinutes: {
      provided: estimatedDuration.provided,
      value: estimatedDuration.provided
        ? estimatedDuration.value ?? null
        : null,
    },
  });

  if (result.status === "ok") {
    return NextResponse.json({ quest: result.quest });
  }

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  if (result.status === "subject_not_found") {
    return NextResponse.json({ error: "Subject is invalid." }, { status: 400 });
  }

  if (result.status === "invalid") {
    return NextResponse.json(
      { error: "Invalid quest settings." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "Unable to save quest settings." },
    { status: 500 }
  );
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invalid quest id." }, { status: 400 });
  }

  const access = await getTeacherAuthoringAccess();

  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (access.status !== "allowed") {
    return NextResponse.json(
      { error: "Authoring access unavailable." },
      { status: 403 }
    );
  }

  const result = await deleteOwnedQuest(id);

  if (result.status === "ok") {
    return new NextResponse(null, { status: 204 });
  }

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Unable to delete quest." },
    { status: 500 }
  );
}
