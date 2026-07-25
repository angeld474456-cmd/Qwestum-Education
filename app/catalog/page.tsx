import type { Metadata } from "next";

import PublicCatalogFilters from "@/components/catalog/PublicCatalogFilters";
import PublicCatalogResults from "@/components/catalog/PublicCatalogResults";
import { listPublicCatalogQuests } from "@/services/public-catalog.server";
import type { PublicCatalogListQuery } from "@/types/public-catalog";

export const metadata: Metadata = {
  title: "Каталог квестов",
  description: "Открытый каталог образовательных квестов Questum.",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

function parseCatalogQuery(
  searchParams: Record<string, string | string[] | undefined>
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

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const query = parseCatalogQuery(await searchParams);
  let result = null;

  try {
    result = await listPublicCatalogQuests(query);
  } catch {
    result = null;
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-8 text-center">
          <h1 className="text-2xl font-semibold">Каталог временно недоступен</h1>
          <p className="mt-3 text-slate-400">Попробуйте обновить страницу позже.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
            Questum
          </p>
          <h1 className="mt-3 text-4xl font-bold">Каталог квестов</h1>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            Открытые образовательные квесты для знакомства и выбора.
          </p>
        </header>

        <PublicCatalogFilters query={query} />
        <PublicCatalogResults result={result} query={query} />
      </div>
    </main>
  );
}
