import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  PublicCatalogLanguageCode,
  PublicCatalogListQuery,
  PublicCatalogListResult,
  PublicCatalogQuest,
} from "@/types/public-catalog";

const PAGE_SIZE = 24;
const FETCH_LIMIT = PAGE_SIZE + 1;
const MAX_OFFSET = 10_000;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicCatalogRpcRow = Record<string, unknown>;

export class PublicCatalogUnavailableError extends Error {
  constructor() {
    super("Public catalog is unavailable.");
  }
}

function normalizeOptionalText(value: string | null) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";

  return normalized || null;
}

function normalizeOffset(offset: number) {
  if (!Number.isInteger(offset)) return 0;

  return Math.min(Math.max(offset, 0), MAX_OFFSET);
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function nullableInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function nullableLanguageCode(
  value: unknown
): PublicCatalogLanguageCode | null {
  return value === "ru" || value === "kk" || value === "en" ? value : null;
}

function isPlainObject(value: unknown): value is PublicCatalogRpcRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function mapPublicCatalogQuest(
  row: unknown
): PublicCatalogQuest | null {
  if (
    !isPlainObject(row) ||
    typeof row.id !== "string" ||
    !isPublicCatalogQuestId(row.id) ||
    typeof row.title !== "string" ||
    typeof row.has_cover !== "boolean"
  ) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: nullableString(row.description),
    subjectName: nullableString(row.subject_name),
    difficulty: nullableInteger(row.difficulty),
    languageCode: nullableLanguageCode(row.language_code),
    gradeMin: nullableInteger(row.grade_min),
    gradeMax: nullableInteger(row.grade_max),
    estimatedDurationMinutes: nullableInteger(row.estimated_duration_minutes),
    category: nullableString(row.category),
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    coverUrl: row.has_cover ? "/api/public/quests/" + row.id + "/cover" : null,
    createdAt: nullableString(row.created_at),
  };
}

export async function listPublicCatalogQuests(
  query: PublicCatalogListQuery
): Promise<PublicCatalogListResult> {
  const supabase = await createClient();
  const offset = normalizeOffset(query.offset);
  const { data, error } = await supabase.rpc(
    "list_public_catalog_quests",
    {
      p_search: normalizeOptionalText(query.search),
      p_subject_name: normalizeOptionalText(query.subject),
      p_grade: query.grade,
      p_difficulty: query.difficulty,
      p_language_code: null,
      p_limit: FETCH_LIMIT,
      p_offset: offset,
    }
  );

  if (error || !Array.isArray(data)) {
    throw new PublicCatalogUnavailableError();
  }

  const quests = (data as unknown[])
    .map(mapPublicCatalogQuest)
    .filter((quest): quest is PublicCatalogQuest => quest !== null);

  return {
    quests: quests.slice(0, PAGE_SIZE),
    hasNext: quests.length > PAGE_SIZE,
    offset,
    pageSize: PAGE_SIZE,
  };
}

export function isPublicCatalogQuestId(value: string) {
  return uuidPattern.test(value);
}

export const getPublicCatalogQuest = cache(
  async (id: string): Promise<PublicCatalogQuest | null> => {
    if (!isPublicCatalogQuestId(id)) return null;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_catalog_quest", {
      p_quest_id: id,
    });

    if (error || !Array.isArray(data)) {
      throw new PublicCatalogUnavailableError();
    }

    for (const row of data as unknown[]) {
      const quest = mapPublicCatalogQuest(row);

      if (quest) return quest;
    }

    return null;
  }
);
