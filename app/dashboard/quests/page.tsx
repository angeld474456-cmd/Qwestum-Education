import Image from "next/image";
import Link from "next/link";

import Card from "@/components/ui/Card";
import { getSafeQuestCoverImagePublicUrl } from "@/lib/storage/quest-cover.server";
import {
  getTeacherSubjects,
  type TeacherSubject,
} from "@/services/subject.server";
import { getQuestLanguageLabel } from "@/services/quest-language";
import {
  getOwnedQuests,
  getOwnedQuestTaskSummary,
  type TeacherQuest,
} from "@/services/teacher-quest.server";

type TeacherQuestLibraryPageProps = {
  searchParams?: Promise<{
    category?: string | string[];
    tag?: string | string[];
  }>;
};

function formatCreatedAt(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
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
    return `Grade ${gradeMin}`;
  }

  return `Grades ${gradeMin}-${gradeMax}`;
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

  return `${subject.name} · Grade ${subject.grade}`;
}

function normalizeFilterValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getFirstSearchParam(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (!firstValue) return "";

  return normalizeFilterValue(firstValue);
}

function getQuestTags(quest: TeacherQuest) {
  return Array.isArray(quest.tags)
    ? quest.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map(normalizeFilterValue)
        .filter(Boolean)
    : [];
}

function getQuestCategory(quest: TeacherQuest) {
  if (typeof quest.category !== "string") return null;

  return normalizeFilterValue(quest.category) || null;
}

function getFilterKey(value: string) {
  return value.toLocaleLowerCase("en");
}

function getUniqueSortedValues(values: string[]) {
  const valuesByKey = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = normalizeFilterValue(value);

    if (!normalizedValue) continue;

    const key = getFilterKey(normalizedValue);

    if (!valuesByKey.has(key)) {
      valuesByKey.set(key, normalizedValue);
    }
  }

  return Array.from(valuesByKey.values()).sort((first, second) =>
    first.localeCompare(second, undefined, { sensitivity: "base" })
  );
}

function questMatchesFilters(
  quest: TeacherQuest,
  activeCategory: string,
  activeTag: string
) {
  const categoryKey = activeCategory ? getFilterKey(activeCategory) : "";
  const tagKey = activeTag ? getFilterKey(activeTag) : "";

  if (categoryKey) {
    const questCategory = getQuestCategory(quest);

    if (!questCategory || getFilterKey(questCategory) !== categoryKey) {
      return false;
    }
  }

  if (tagKey) {
    const questTagKeys = getQuestTags(quest).map(getFilterKey);

    if (!questTagKeys.includes(tagKey)) {
      return false;
    }
  }

  return true;
}

export default async function TeacherQuestLibraryPage({
  searchParams,
}: TeacherQuestLibraryPageProps) {
  const [quests, tasks, subjects] = await Promise.all([
    getOwnedQuests(),
    getOwnedQuestTaskSummary(),
    getTeacherSubjects(),
  ]);
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeCategory = getFirstSearchParam(resolvedSearchParams.category);
  const activeTag = getFirstSearchParam(resolvedSearchParams.tag);
  const hasActiveFilters = Boolean(activeCategory || activeTag);
  const categoryOptions = getUniqueSortedValues(
    quests.map(getQuestCategory).filter((value): value is string => Boolean(value))
  );
  const tagOptions = getUniqueSortedValues(quests.flatMap(getQuestTags));
  const filteredQuests = quests.filter((quest) =>
    questMatchesFilters(quest, activeCategory, activeTag)
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
            Teacher Quest Library
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Manage your educational quests, open the editor, and prepare
            upcoming preview and play flows.
          </p>
        </div>

        <Link
          href="/quests/new"
          className="inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Create new quest
        </Link>
      </div>

      {quests.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-2xl font-semibold">
            No quests yet
          </h2>

          <p className="mt-3 text-slate-400">
            Create your first quest to start building the teacher library.
          </p>

          <Link
            href="/quests/new"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Create new quest
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Total quests</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Public quests</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.publicQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Draft quests</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.draftQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Total tasks</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalTasks}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Total points</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalPoints}
              </p>
            </div>
          </div>

          <form
            action="/dashboard/quests"
            className="rounded-xl border border-slate-800 bg-[#111827] p-5"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <div>
                <label
                  htmlFor="quest-category-filter"
                  className="text-sm font-semibold text-slate-200"
                >
                  Category
                </label>
                <select
                  id="quest-category-filter"
                  name="category"
                  defaultValue={activeCategory}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((category) => (
                    <option key={getFilterKey(category)} value={category}>
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
                  Tag
                </label>
                <select
                  id="quest-tag-filter"
                  name="tag"
                  defaultValue={activeTag}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="">All tags</option>
                  {tagOptions.map((tag) => (
                    <option key={getFilterKey(tag)} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Apply filters
              </button>

              {hasActiveFilters ? (
                <Link
                  href="/dashboard/quests"
                  className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Clear filters
                </Link>
              ) : null}
            </div>
          </form>

          {filteredQuests.length === 0 ? (
            <Card className="text-center">
              <h2 className="text-2xl font-semibold">
                No quests match the selected filters.
              </h2>

              <p className="mt-3 text-slate-400">
                Clear filters to return to your full quest library.
              </p>

              <Link
                href="/dashboard/quests"
                className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
              >
                Clear filters
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
              const categoryLabel = getQuestCategory(quest);
              const tagLabels = getQuestTags(quest);

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
                              No cover
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
                              {quest.is_public ? "Public" : "Draft"}
                            </span>
                          </div>

                          <p className="mt-3 max-w-3xl text-slate-400">
                            {quest.description || "No description provided."}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>Difficulty: {quest.difficulty ?? "Not available"}</span>
                            <span>Created: {formatCreatedAt(quest.created_at)}</span>
                            <span>Tasks: {taskCount}</span>
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
                                  key={`${quest.id}-${getFilterKey(tag)}`}
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
                        Open / Edit quest
                      </Link>

                      <Link
                        href={`/quests/${quest.id}/tasks`}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        Edit tasks
                      </Link>

                      <Link
                        href={`/dashboard/quests/${quest.id}/preview`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                      >
                        Preview
                      </Link>

                      <Link
                        href={`/dashboard/quests/${quest.id}/play`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                      >
                        Play/Test
                      </Link>
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
