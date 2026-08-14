"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import Card from "@/components/ui/Card";
import QuestPublicationReadiness from "@/components/dashboard/QuestPublicationReadiness";
import {
  isSessionExpiredResponse,
  redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";
import {
  getQuestLanguageLabel,
  QUEST_LANGUAGE_OPTIONS,
  type QuestLanguageCode,
} from "@/services/quest-language";

type QuestSettingsFormProps = {
  quest: {
    id: string;
    title: string;
    description: string | null;
    subject_id: string | null;
    language_code: QuestLanguageCode | null;
    category: string | null;
    tags: string[];
    difficulty: number;
    is_public: boolean;
    grade_min: number | null;
    grade_max: number | null;
    estimated_duration_minutes: number | null;
  };
  subjects: SubjectOption[];
  taskCount: number;
};

type QuestSettingsResponse = {
  quest?: {
    id: string;
    title: string;
    description: string | null;
    subject_id: string | null;
    language_code: QuestLanguageCode | null;
    category: string | null;
    tags: string[];
    difficulty: number;
    is_public: boolean;
    grade_min: number | null;
    grade_max: number | null;
    estimated_duration_minutes: number | null;
  };
  error?: string;
};

type SubjectOption = {
  id: string;
  name: string;
  grade: number | null;
};

function metadataValue(value: number | null) {
  return value === null ? "" : String(value);
}

function normalizeTextInput(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function formatTagsInput(tags: string[] | null | undefined): string {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function formatSubjectOption(subject: SubjectOption) {
  if (subject.grade === null) {
    return `${subject.name} — все классы`;
  }

  return `${subject.name} — ${subject.grade} класс`;
}

export default function QuestSettingsForm({
  quest,
  subjects,
  taskCount,
}: QuestSettingsFormProps) {
  const [title, setTitle] = useState(quest.title ?? "");
  const [description, setDescription] = useState(quest.description ?? "");
  const [subjectId, setSubjectId] = useState(quest.subject_id ?? "");
  const [languageCode, setLanguageCode] = useState(quest.language_code ?? "");
  const [category, setCategory] = useState(quest.category ?? "");
  const [tagsInput, setTagsInput] = useState(formatTagsInput(quest.tags));
  const [difficulty, setDifficulty] = useState(Number(quest.difficulty) || 1);
  const [readinessInvalidationKey, setReadinessInvalidationKey] = useState(0);
  const [gradeMin, setGradeMin] = useState(metadataValue(quest.grade_min));
  const [gradeMax, setGradeMax] = useState(metadataValue(quest.grade_max));
  const [estimatedDuration, setEstimatedDuration] = useState(
    metadataValue(quest.estimated_duration_minutes)
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const hasTasks = taskCount > 0;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const normalizedTitle = title.trim();
    const normalizedCategory = normalizeTextInput(category);
    const normalizedTags = tagsInput
      .split(",")
      .map((tag) => normalizeTextInput(tag))
      .filter(Boolean);
    const normalizedDifficulty = Number(difficulty);
    const normalizedGradeMin = gradeMin === "" ? null : Number(gradeMin);
    const normalizedGradeMax =
      gradeMax === "" && normalizedGradeMin !== null
        ? normalizedGradeMin
        : gradeMax === ""
          ? null
          : Number(gradeMax);
    const normalizedDuration =
      estimatedDuration === "" ? null : Number(estimatedDuration);

    setErrorMessage("");
    setSuccessMessage("");

    if (!normalizedTitle) {
      setErrorMessage("Введите название квеста.");
      return;
    }

    if (Number.isNaN(normalizedDifficulty)) {
      setErrorMessage("Сложность должна быть числом.");
      return;
    }

    if (normalizedCategory.length > 40) {
      setErrorMessage("Категория должна быть не длиннее 40 символов.");
      return;
    }

    if (normalizedTags.length > 10) {
      setErrorMessage("Можно указать не больше 10 тегов.");
      return;
    }

    if (normalizedTags.some((tag) => tag.length > 24)) {
      setErrorMessage("Каждый тег должен быть не длиннее 24 символов.");
      return;
    }

    if (gradeMin === "" && gradeMax !== "") {
      setErrorMessage("Сначала укажите начальный класс.");
      return;
    }

    if (
      normalizedGradeMin !== null &&
      (!Number.isInteger(normalizedGradeMin) ||
        normalizedGradeMin < 1 ||
        normalizedGradeMin > 11)
    ) {
      setErrorMessage("Начальный класс должен быть от 1 до 11.");
      return;
    }

    if (
      normalizedGradeMax !== null &&
      (!Number.isInteger(normalizedGradeMax) ||
        normalizedGradeMax < 1 ||
        normalizedGradeMax > 11)
    ) {
      setErrorMessage("Конечный класс должен быть от 1 до 11.");
      return;
    }

    if (
      normalizedGradeMin !== null &&
      normalizedGradeMax !== null &&
      normalizedGradeMin > normalizedGradeMax
    ) {
      setErrorMessage("Начальный класс должен быть не больше конечного.");
      return;
    }

    if (
      normalizedDuration !== null &&
      (!Number.isInteger(normalizedDuration) ||
        normalizedDuration < 5 ||
        normalizedDuration > 240)
    ) {
      setErrorMessage("Примерная длительность должна быть от 5 до 240 минут.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/teacher/quests/${quest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: normalizedTitle,
          description,
          subject_id: subjectId || null,
          language_code: languageCode || null,
          category,
          tags: tagsInput.split(",").map((tag) => tag.trim()),
          difficulty: normalizedDifficulty,
          grade_min: normalizedGradeMin,
          grade_max: normalizedGradeMax,
          estimated_duration_minutes: normalizedDuration,
        }),
      });

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        redirectToSessionExpiredLogin();
        return;
      }

      const result = (await response.json()) as QuestSettingsResponse;

      if (!response.ok || !result.quest) {
        setErrorMessage(result.error ?? "Не удалось сохранить настройки квеста.");
        return;
      }

      setTitle(result.quest.title ?? "");
      setDescription(result.quest.description ?? "");
      setSubjectId(result.quest.subject_id ?? "");
      setLanguageCode(result.quest.language_code ?? "");
      setCategory(result.quest.category ?? "");
      setTagsInput(formatTagsInput(result.quest.tags));
      setDifficulty(Number(result.quest.difficulty) || 1);
      setGradeMin(metadataValue(result.quest.grade_min));
      setGradeMax(metadataValue(result.quest.grade_max));
      setEstimatedDuration(
        metadataValue(result.quest.estimated_duration_minutes)
      );
      setReadinessInvalidationKey((current) => current + 1);
      setSuccessMessage("Настройки квеста сохранены.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Не удалось сохранить настройки квеста.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label
            htmlFor="quest-title"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Название квеста
          </label>
          <input
            id="quest-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="quest-description"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Описание
          </label>
          <textarea
            id="quest-description"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="quest-subject"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Предмет
          </label>
          <select
            id="quest-subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          >
            <option value="">Предмет не указан</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {formatSubjectOption(subject)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="quest-language"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Язык
          </label>
          <select
            id="quest-language"
            value={languageCode}
            onChange={(event) => setLanguageCode(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          >
            <option value="">Язык не указан</option>
            {QUEST_LANGUAGE_OPTIONS.map((language) => (
              <option key={language.code} value={language.code}>
                {getQuestLanguageLabel(language.code)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="quest-category"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Категория
          </label>
          <input
            id="quest-category"
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
          <p className="mt-2 text-sm text-slate-400">
            Необязательно. Максимум 40 символов.
          </p>
        </div>

        <div>
          <label
            htmlFor="quest-tags"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Теги
          </label>
          <input
            id="quest-tags"
            type="text"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
          <p className="mt-2 text-sm text-slate-400">
            Разделяйте теги запятыми. Максимум 10 тегов, до 24 символов каждый.
          </p>
        </div>

        <div>
          <label
            htmlFor="quest-difficulty"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Сложность
          </label>
          <select
            id="quest-difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="quest-grade-min"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Класс от
            </label>
            <select
              id="quest-grade-min"
              value={gradeMin}
              onChange={(event) => setGradeMin(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
            >
              <option value="">Не указано</option>
              {Array.from({ length: 11 }, (_, index) => index + 1).map(
                (grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="quest-grade-max"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Класс до
            </label>
            <select
              id="quest-grade-max"
              value={gradeMax}
              onChange={(event) => setGradeMax(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
            >
              <option value="">Не указано</option>
              {Array.from({ length: 11 }, (_, index) => index + 1).map(
                (grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="quest-estimated-duration"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Примерная длительность, мин.
            </label>
            <input
              id="quest-estimated-duration"
              type="number"
              min={5}
              max={240}
              step={1}
              value={estimatedDuration}
              onChange={(event) => setEstimatedDuration(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div
            className={`rounded-xl border p-4 ${
              hasTasks
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-cyan-500/30 bg-cyan-500/10"
            }`}
          >
            {hasTasks ? (
              <>
                <p className="text-sm font-semibold text-emerald-200">
                  Заданий: {taskCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Квест можно опубликовать.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-cyan-200">
                  Для публикации нужно хотя бы одно задание.
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Добавьте задание, затем вернитесь в настройки и включите
                  публикацию.
                </p>
                <Link
                  href={`/dashboard/quests/${quest.id}/tasks`}
                  className="mt-3 inline-flex text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  Перейти к заданиям
                </Link>
              </>
            )}
          </div>

          <QuestPublicationReadiness
            questId={quest.id}
            initialIsPublic={quest.is_public}
            readinessInvalidationKey={readinessInvalidationKey}
          />
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-violet-600 px-8 py-4 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить настройки"}
        </button>
      </form>
    </Card>
  );
}
