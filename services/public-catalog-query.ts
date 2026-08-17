import type { PublicCatalogListQuery } from "@/types/public-catalog";

export type PublicCatalogSearchParams = Record<
  string,
  string | string[] | undefined
>;

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeText(value: string | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";

  return normalized || null;
}

function parseInteger(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseGrade(value: string | undefined) {
  const grade = parseInteger(value);

  return grade !== null && grade >= 1 && grade <= 11 ? grade : null;
}

function parseDifficulty(value: string | undefined) {
  const difficulty = parseInteger(value);

  return difficulty !== null && difficulty >= 1 && difficulty <= 3
    ? difficulty
    : null;
}

export function parsePublicCatalogQuery(
  searchParams: PublicCatalogSearchParams
): PublicCatalogListQuery {
  const offset = parseInteger(getFirstSearchParam(searchParams.offset));

  return {
    search: normalizeText(getFirstSearchParam(searchParams.search)),
    subject: normalizeText(getFirstSearchParam(searchParams.subject)),
    grade: parseGrade(getFirstSearchParam(searchParams.grade)),
    difficulty: parseDifficulty(getFirstSearchParam(searchParams.difficulty)),
    offset: Math.min(offset ?? 0, 10_000),
  };
}
