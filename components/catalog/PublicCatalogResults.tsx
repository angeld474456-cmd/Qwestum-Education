import Link from "next/link";

import PublicCatalogState from "@/components/catalog/PublicCatalogState";
import PublicQuestCover from "@/components/catalog/PublicQuestCover";
import type {
  PublicCatalogListQuery,
  PublicCatalogListResult,
  PublicCatalogQuest,
} from "@/types/public-catalog";

type PublicCatalogResultsProps = {
  result: PublicCatalogListResult;
  query: PublicCatalogListQuery;
};

function formatGradeRange(quest: PublicCatalogQuest) {
  if (quest.gradeMin === null || quest.gradeMax === null) {
    return "Класс не указан";
  }

  return quest.gradeMin === quest.gradeMax
    ? `${quest.gradeMin} класс`
    : `${quest.gradeMin}-${quest.gradeMax} классы`;
}

function formatCreatedAt(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ru", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function buildCatalogHref(query: PublicCatalogListQuery, offset: number) {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.subject) params.set("subject", query.subject);
  if (query.grade !== null) params.set("grade", query.grade.toString());
  if (query.difficulty !== null) {
    params.set("difficulty", query.difficulty.toString());
  }
  if (offset > 0) params.set("offset", offset.toString());

  const search = params.toString();

  return search ? `/catalog?${search}` : "/catalog";
}

export default function PublicCatalogResults({
  result,
  query,
}: PublicCatalogResultsProps) {
  if (result.quests.length === 0) {
    if (result.offset > 0) {
      const previousOffset = Math.max(0, result.offset - result.pageSize);
      const paginationActions =
        previousOffset === 0
          ? [
              {
                href: buildCatalogHref(query, 0),
                label: "\u0412 \u043d\u0430\u0447\u0430\u043b\u043e \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430",
                primary: true,
              },
            ]
          : [
              {
                href: buildCatalogHref(query, previousOffset),
                label: "\u041d\u0430\u0437\u0430\u0434",
                primary: true,
              },
              {
                href: buildCatalogHref(query, 0),
                label: "\u0412 \u043d\u0430\u0447\u0430\u043b\u043e \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430",
              },
            ];

      return (
        <PublicCatalogState
          tone="empty"
          headingLevel={2}
          title={"\u041d\u0430 \u044d\u0442\u043e\u0439 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0435 \u043a\u0432\u0435\u0441\u0442\u043e\u0432 \u043d\u0435\u0442"}
          description={"\u0412\u0435\u0440\u043d\u0438\u0442\u0435\u0441\u044c \u043d\u0430 \u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0443\u044e \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u0438\u043b\u0438 \u0432 \u043d\u0430\u0447\u0430\u043b\u043e \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430."}
          actions={paginationActions}
        />
      );
    }

    const hasActiveFilters =
      query.search !== null ||
      query.subject !== null ||
      query.grade !== null ||
      query.difficulty !== null;

    return (
      <PublicCatalogState
        tone="empty"
        headingLevel={2}
        title={
          hasActiveFilters
            ? "\u041a\u0432\u0435\u0441\u0442\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b"
            : "\u0412 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0435 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043a\u0432\u0435\u0441\u0442\u043e\u0432"
        }
        description={
          hasActiveFilters
            ? "\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u0435 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u043f\u043e\u0438\u0441\u043a\u0430 \u0438\u043b\u0438 \u0441\u0431\u0440\u043e\u0441\u044c\u0442\u0435 \u0444\u0438\u043b\u044c\u0442\u0440\u044b."
            : "\u041a\u043e\u0433\u0434\u0430 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u043a\u0432\u0435\u0441\u0442\u044b, \u043e\u043d\u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c."
        }
        actions={
          hasActiveFilters
            ? [
                {
                  href: "/catalog",
                  label: "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440\u044b",
                  primary: true,
                },
              ]
            : []
        }
      />
    );
  }

  const previousOffset = Math.max(0, result.offset - result.pageSize);
  const nextOffset = Math.min(10_000, result.offset + result.pageSize);

  return (
    <section className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {result.quests.map((quest) => {
          const createdAt = formatCreatedAt(quest.createdAt);

          return (
            <Link
              key={quest.id}
              href={`/catalog/${quest.id}`}
              className="group flex min-w-0 flex-col rounded-lg border border-slate-800 bg-[#111827] p-5 outline-none transition hover:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <PublicQuestCover
                title={quest.title}
                coverUrl={quest.coverUrl}
                loading="lazy"
              />
              <div className="mt-5 min-w-0">
                <h2 className="text-xl font-bold text-white group-hover:text-violet-200">
                  {quest.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                  {quest.description ?? "Описание не добавлено."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {quest.subjectName ? (
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 font-semibold text-violet-200">
                      {quest.subjectName}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-200">
                    {formatGradeRange(quest)}
                  </span>
                  {quest.difficulty !== null ? (
                    <span className="rounded-full bg-slate-700 px-3 py-1 font-semibold text-slate-200">
                      Сложность: {quest.difficulty}
                    </span>
                  ) : null}
                </div>
                {quest.category || quest.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {quest.category ? (
                      <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 font-semibold text-fuchsia-200">
                        {quest.category}
                      </span>
                    ) : null}
                    {quest.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-800 px-3 py-1 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {createdAt ? (
                  <p className="mt-4 text-xs text-slate-500">
                    Добавлено: {createdAt}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Пагинация каталога"
      >
        {result.offset === 0 ? (
          <span
            aria-disabled="true"
            className="rounded-lg border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Назад
          </span>
        ) : (
          <Link
            href={buildCatalogHref(query, previousOffset)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Назад
          </Link>
        )}

        {result.hasNext && result.offset < 10_000 ? (
          <Link
            href={buildCatalogHref(query, nextOffset)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Далее
          </Link>
        ) : (
          <span className="text-sm text-slate-500">Больше квестов нет</span>
        )}
      </nav>
    </section>
  );
}
