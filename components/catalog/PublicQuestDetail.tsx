import Link from "next/link";

import type { PublicCatalogQuest } from "@/types/public-catalog";

type PublicQuestDetailProps = {
  quest: PublicCatalogQuest;
};

function formatGradeRange(quest: PublicCatalogQuest) {
  if (quest.gradeMin === null || quest.gradeMax === null) return null;

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

export default function PublicQuestDetail({ quest }: PublicQuestDetailProps) {
  const gradeLabel = formatGradeRange(quest);
  const createdAt = formatCreatedAt(quest.createdAt);

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <div className="aspect-video rounded-lg border border-slate-800 bg-slate-900" />

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
          Каталог квестов
        </p>
        <h1 className="mt-3 text-4xl font-bold text-white">{quest.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          {quest.description ?? "Описание не добавлено."}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {quest.subjectName ? (
          <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
            <dt className="text-sm text-slate-400">Предмет</dt>
            <dd className="mt-1 font-semibold text-white">{quest.subjectName}</dd>
          </div>
        ) : null}
        {gradeLabel ? (
          <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
            <dt className="text-sm text-slate-400">Класс</dt>
            <dd className="mt-1 font-semibold text-white">{gradeLabel}</dd>
          </div>
        ) : null}
        {quest.difficulty !== null ? (
          <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
            <dt className="text-sm text-slate-400">Сложность</dt>
            <dd className="mt-1 font-semibold text-white">
              {quest.difficulty}
            </dd>
          </div>
        ) : null}
        {quest.languageCode ? (
          <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
            <dt className="text-sm text-slate-400">Язык</dt>
            <dd className="mt-1 font-semibold text-white">
              {quest.languageCode}
            </dd>
          </div>
        ) : null}
        {quest.estimatedDurationMinutes !== null ? (
          <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
            <dt className="text-sm text-slate-400">Продолжительность</dt>
            <dd className="mt-1 font-semibold text-white">
              {quest.estimatedDurationMinutes} мин.
            </dd>
          </div>
        ) : null}
        {createdAt ? (
          <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
            <dt className="text-sm text-slate-400">Добавлено</dt>
            <dd className="mt-1 font-semibold text-white">{createdAt}</dd>
          </div>
        ) : null}
      </dl>

      {quest.category || quest.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm">
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

      <Link
        href="/catalog"
        className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
      >
        Вернуться к каталогу
      </Link>
    </article>
  );
}
