import Image from "next/image";
import Link from "next/link";

import QuestDuplicateButton from "@/components/dashboard/QuestDuplicateButton";
import Card from "@/components/ui/Card";
import {
  getTeacherQuestLibraryCategory,
  getTeacherQuestLibraryFilterKey,
  getTeacherQuestLibrarySearchParam,
  getTeacherQuestLibraryTags,
  matchesTeacherQuestLibraryFilters,
  normalizeTeacherQuestLibraryFilterValue,
} from "@/lib/teacher-quest-library-filters";
import { getSafeQuestCoverImagePublicUrl } from "@/lib/storage/quest-cover.server";
import {
  getTeacherSubjects,
  type TeacherSubject,
} from "@/services/subject.server";
import { getQuestLanguageLabel } from "@/services/quest-language";
import {
  getOwnedQuests,
  getOwnedQuestTaskSummary,
} from "@/services/teacher-quest.server";

type TeacherQuestLibraryPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    category?: string | string[];
    tag?: string | string[];
  }>;
};

function formatCreatedAt(value?: string) {
  if (!value) return "Нет данных";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Нет данных";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatGradeRange(gradeMin: number | null, gradeMax: number | null) {
  if (gradeMin === null || gradeMax === null) return null;

  if (gradeMin === gradeMax) {
    return `${gradeMin} класс`;
  }

  return `${gradeMin}-${gradeMax} классы`;
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return null;

  return `${minutes} min`;
}

function formatSubject(subject: TeacherSubject | undefined) {
  if (!subject) return null;

  if (subject.grade === null) {
    return subject.name;
  }

  return `${subject.name} · ${subject.grade} класс`;
}

function getUniqueSortedValues(values: string[]) {
  const valuesByKey = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = normalizeTeacherQuestLibraryFilterValue(value);

    if (!normalizedValue) continue;

    const key = getTeacherQuestLibraryFilterKey(normalizedValue);

    if (!valuesByKey.has(key)) {
      valuesByKey.set(key, normalizedValue);
    }
  }

  return Array.from(valuesByKey.values()).sort((first, second) =>
    first.localeCompare(second, undefined, { sensitivity: "base" })
  );
}

export default async function TeacherQuestLibraryPage({
  searchParams,
}: TeacherQuestLibraryPageProps) {
  const [quests, tasks] = await Promise.all([
    getOwnedQuests(),
    getOwnedQuestTaskSummary(),
  ]);
  const subjects = await getTeacherSubjects({
    includeSubjectIds: quests.flatMap((quest) =>
      quest.subject_id ? [quest.subject_id] : []
    ),
  });
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeSearch = getTeacherQuestLibrarySearchParam(resolvedSearchParams.q);
  const activeCategory = getTeacherQuestLibrarySearchParam(
    resolvedSearchParams.category
  );
  const activeTag = getTeacherQuestLibrarySearchParam(resolvedSearchParams.tag);
  const hasActiveFilters = Boolean(activeSearch || activeCategory || activeTag);
  const categoryOptions = getUniqueSortedValues(
    quests
      .map(getTeacherQuestLibraryCategory)
      .filter((value): value is string => Boolean(value))
  );
  const tagOptions = getUniqueSortedValues(quests.flatMap(getTeacherQuestLibraryTags));
  const filteredQuests = quests.filter((quest) =>
    matchesTeacherQuestLibraryFilters(quest, {
      search: activeSearch,
      category: activeCategory,
      tag: activeTag,
    })
  );

  const subjectsById = new Map(
    subjects.map((subject) => [subject.id, subject])
  );

  const taskCountsByQuestId = tasks.reduce<Record<string, number>>(
    (counts, task) => {
      counts[task.quest_id] = (counts[task.quest_id] ?? 0) + 1;
      return counts;
    },
    {}
  );

  const totalQuests = quests.length;
  const publicQuests = quests.filter((quest) => quest.is_public).length;
  const totalTasks = tasks.length;
  const totalPoints = tasks.reduce(
    (sum, task) => sum + (Number(task.points) || 0),
    0
  );

  const libraryAnalytics = {
    totalQuests,
    publicQuests,
    draftQuests: totalQuests - publicQuests,
    totalTasks,
    totalPoints,
  };

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Библиотека квестов
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Управляйте образовательными квестами, заданиями, предпросмотром и
            тестированием.
          </p>
        </div>

        <Link
          href="/dashboard/quests/new"
          className="inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Создать квест
        </Link>
      </div>

      {quests.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-2xl font-semibold">
            Квестов пока нет
          </h2>

          <p className="mt-3 text-slate-400">
            Создайте первый квест, чтобы начать наполнять библиотеку.
          </p>

          <Link
            href="/dashboard/quests/new"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Создать квест
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Всего квестов</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Опубликовано</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.publicQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Черновики</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.draftQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Всего заданий</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalTasks}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Всего баллов</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalPoints}
              </p>
            </div>
          </div>

          <form
            key={`${activeSearch}\u0000${activeCategory}\u0000${activeTag}`}
            action="/dashboard/quests"
            className="rounded-xl border border-slate-800 bg-[#111827] p-5"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_1fr_1fr_auto_auto] md:items-end">
              <div>
                <label
                  htmlFor="quest-search"
                  className="text-sm font-semibold text-slate-200"
                >
                  {"\u041f\u043e\u0438\u0441\u043a"}
                </label>
                <input
                  id="quest-search"
                  name="q"
                  type="search"
                  defaultValue={activeSearch}
                  placeholder={"\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438\u043b\u0438 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435"}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label
                  htmlFor="quest-category-filter"
                  className="text-sm font-semibold text-slate-200"
                >
                  Категория
                </label>
                <select
                  id="quest-category-filter"
                  name="category"
                  defaultValue={activeCategory}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="">Все категории</option>
                  {categoryOptions.map((category) => (
                    <option
                      key={getTeacherQuestLibraryFilterKey(category)}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="quest-tag-filter"
                  className="text-sm font-semibold text-slate-200"
                >
                  Тег
                </label>
                <select
                  id="quest-tag-filter"
                  name="tag"
                  defaultValue={activeTag}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="">Все теги</option>
                  {tagOptions.map((tag) => (
                    <option
                      key={getTeacherQuestLibraryFilterKey(tag)}
                      value={tag}
                    >
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Применить фильтры
              </button>

              {hasActiveFilters ? (
                <Link
                  href="/dashboard/quests"
                  className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Сбросить фильтры
                </Link>
              ) : null}
            </div>
          </form>

          {filteredQuests.length === 0 ? (
            <Card className="text-center">
              <h2 className="text-2xl font-semibold">
                По выбранным фильтрам квесты не найдены.
              </h2>

              <p className="mt-3 text-slate-400">
                Сбросьте фильтры, чтобы вернуться ко всей библиотеке.
              </p>

              <Link
                href="/dashboard/quests"
                className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
              >
                Сбросить фильтры
              </Link>
            </Card>
          ) : null}

          <div className="grid gap-6">
            {filteredQuests.map((quest) => {
              const taskCount = taskCountsByQuestId[quest.id] ?? 0;
              const coverImageUrl = getSafeQuestCoverImagePublicUrl(
                quest.cover_image_path,
                quest.author_id,
                quest.id
              );
              const gradeLabel = formatGradeRange(
                quest.grade_min,
                quest.grade_max
              );
              const durationLabel = formatDuration(
                quest.estimated_duration_minutes
              );
              const subjectLabel = quest.subject_id
                ? formatSubject(subjectsById.get(quest.subject_id))
                : null;
              const languageLabel = getQuestLanguageLabel(quest.language_code);
              const categoryLabel = getTeacherQuestLibraryCategory(quest);
              const tagLabels = getTeacherQuestLibraryTags(quest);

              return (
                <Card key={quest.id}>
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <Link
                      href={`/dashboard/quests/${quest.id}/settings`}
                      className="min-w-0 rounded-xl outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                        <div className="aspect-video overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950">
                          {coverImageUrl ? (
                            <Image
                              src={coverImageUrl}
                              alt={`${quest.title} cover image`}
                              width={640}
                              height={360}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-slate-500">
                              Нет обложки
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold">
                              {quest.title}
                            </h2>

                            <span
                              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                quest.is_public
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-amber-500/15 text-amber-300"
                              }`}
                            >
                              {quest.is_public ? "Опубликован" : "Черновик"}
                            </span>
                          </div>

                          <p className="mt-3 max-w-3xl text-slate-400">
                            {quest.description || "Описание не добавлено."}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>Сложность: {quest.difficulty ?? "Нет данных"}</span>
                            <span>Создан: {formatCreatedAt(quest.created_at)}</span>
                            <span>Заданий: {taskCount}</span>
                          </div>

                          {subjectLabel ||
                          languageLabel ||
                          gradeLabel ||
                          durationLabel ||
                          categoryLabel ||
                          tagLabels.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2 text-sm">
                              {subjectLabel ? (
                                <span className="rounded-full bg-violet-500/10 px-3 py-1 font-semibold text-violet-200">
                                  {subjectLabel}
                                </span>
                              ) : null}
                              {languageLabel ? (
                                <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-semibold text-indigo-200">
                                  {languageLabel}
                                </span>
                              ) : null}
                              {gradeLabel ? (
                                <span className="rounded-full bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-200">
                                  {gradeLabel}
                                </span>
                              ) : null}
                              {durationLabel ? (
                                <span className="rounded-full bg-slate-700 px-3 py-1 font-semibold text-slate-200">
                                  {durationLabel}
                                </span>
                              ) : null}
                              {categoryLabel ? (
                                <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 font-semibold text-fuchsia-200">
                                  {categoryLabel}
                                </span>
                              ) : null}
                              {tagLabels.map((tag) => (
                                <span
                                  key={`${quest.id}-${getTeacherQuestLibraryFilterKey(tag)}`}
                                  className="rounded-full bg-slate-800 px-3 py-1 font-semibold text-slate-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/quests/${quest.id}/settings`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Открыть настройки
                      </Link>

                      <Link
                        href={`/dashboard/quests/${quest.id}/tasks`}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        Задания
                      </Link>

                      <Link
                        href={`/dashboard/quests/${quest.id}/preview`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                      >
                        Предпросмотр
                      </Link>

                      <Link
                        href={`/dashboard/quests/${quest.id}/play`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                      >
                        Тестирование
                      </Link>

                      <QuestDuplicateButton questId={quest.id} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
