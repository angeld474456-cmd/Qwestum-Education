"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  PublicRuntimeQuest,
  PublicRuntimeQuestV2,
  PublicRuntimeResult,
  PublicRuntimeSubmission,
  PublicRuntimeTask,
  PublicRuntimeTaskResult,
  PublicRuntimeTaskStatus,
} from "@/types/public-runtime";

import PublicQuestResults from "./PublicQuestResults";
import PublicTaskRenderer from "./PublicTaskRenderer";

type PublicRuntimeQuestForRunner = PublicRuntimeQuest | PublicRuntimeQuestV2;
type PublicRuntimeTaskForRunner = PublicRuntimeTask | PublicRuntimeQuestV2["tasks"][number];

type PublicQuestRunnerProps = {
  quest: PublicRuntimeQuestForRunner;
  submitUrl?: string;
  retryHref?: string;
  catalogHref?: string;
};

export type PublicQuestRunnerPhase =
  | "mission"
  | "active"
  | "transition"
  | "submitting"
  | "completed"
  | "submission_error";

type PlainObject = Record<string, unknown>;

const MAX_TASKS = 100;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedStatuses = new Set<PublicRuntimeTaskStatus>([
  "correct",
  "incorrect",
  "unanswered",
  "not_scored",
]);
const unavailableQuestMessage = "Квест недоступен для прохождения";
const submissionErrorMessage =
  "Не удалось проверить ответы. Попробуйте ещё раз";

function isPlainObject(value: unknown): value is PlainObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isNarrativeText(value: unknown): value is string {
  return typeof value === "string" && /\S/.test(value);
}

function getMissionIntro(quest: PublicRuntimeQuestForRunner) {
  return "missionIntro" in quest && isNarrativeText(quest.missionIntro)
    ? quest.missionIntro
    : null;
}

function getTaskNarrativeIntro(task: PublicRuntimeTaskForRunner) {
  return "narrativeIntro" in task && isNarrativeText(task.narrativeIntro)
    ? task.narrativeIntro
    : null;
}

function getTaskNarrativeSuccess(task: PublicRuntimeTaskForRunner) {
  return "narrativeSuccess" in task && isNarrativeText(task.narrativeSuccess)
    ? task.narrativeSuccess
    : null;
}

export function getInitialPublicQuestRunnerPhase(
  quest: PublicRuntimeQuestForRunner
): PublicQuestRunnerPhase {
  return getMissionIntro(quest) ? "mission" : "active";
}

export function shouldShowPublicQuestTransition(
  task: PublicRuntimeTaskForRunner,
  isFinalTask: boolean
) {
  return !isFinalTask && Boolean(getTaskNarrativeSuccess(task));
}

export function createPublicRuntimeSubmission(
  quest: Pick<PublicRuntimeQuestForRunner, "tasks">,
  selectedOptionIds: Record<string, string>,
  selectedMultipleChoiceOptionIds: Record<string, string[]>
): PublicRuntimeSubmission {
  return {
    answers: quest.tasks.map((task) => {
      const selectedOptionId = selectedOptionIds[task.id];
      const selectedOptionIdsForTask = selectedMultipleChoiceOptionIds[task.id];

      if (task.taskType === "single_choice" && selectedOptionId) {
        return { taskId: task.id, selectedOptionId };
      }

      if (
        task.taskType === "multiple_choice" &&
        selectedOptionIdsForTask &&
        selectedOptionIdsForTask.length > 0
      ) {
        return { taskId: task.id, selectedOptionIds: selectedOptionIdsForTask };
      }

      return { taskId: task.id };
    }),
  };
}

function isValidQuest(quest: PublicRuntimeQuestForRunner) {
  if (
    !Array.isArray(quest.tasks) ||
    quest.tasks.length < 1 ||
    quest.tasks.length > MAX_TASKS
  ) {
    return false;
  }

  const taskIds = new Set<string>();

  for (const task of quest.tasks) {
    if (!isUuid(task.id) || taskIds.has(task.id)) return false;

    taskIds.add(task.id);

    if (task.taskType === "text") continue;

    if (
      (task.taskType !== "single_choice" &&
        task.taskType !== "multiple_choice") ||
      !Array.isArray(task.options) ||
      task.options.length < 2 ||
      task.options.length > MAX_TASKS
    ) {
      return false;
    }

    const optionIds = new Set<string>();

    for (const option of task.options) {
      if (
        typeof option.id !== "string" ||
        option.id.length === 0 ||
        optionIds.has(option.id)
      ) {
        return false;
      }

      optionIds.add(option.id);
    }
  }

  return true;
}

function mapTaskResult(value: unknown): PublicRuntimeTaskResult | null {
  if (
    !isPlainObject(value) ||
    !isUuid(value.taskId) ||
    typeof value.status !== "string" ||
    !allowedStatuses.has(value.status as PublicRuntimeTaskStatus)
  ) {
    return null;
  }

  return {
    taskId: value.taskId,
    status: value.status as PublicRuntimeTaskStatus,
  };
}

function mapResult(
  value: unknown,
  quest: PublicRuntimeQuestForRunner
): PublicRuntimeResult | null {
  if (
    !isPlainObject(value) ||
    !isSafeNonNegativeInteger(value.earnedPoints) ||
    !isSafeNonNegativeInteger(value.possiblePoints) ||
    !isSafeNonNegativeInteger(value.correctCount) ||
    !isSafeNonNegativeInteger(value.incorrectCount) ||
    !isSafeNonNegativeInteger(value.unansweredCount) ||
    !isSafeNonNegativeInteger(value.notScoredCount) ||
    value.earnedPoints > value.possiblePoints ||
    !Array.isArray(value.taskResults) ||
    value.taskResults.length < 1 ||
    value.taskResults.length > MAX_TASKS ||
    value.taskResults.length !== quest.tasks.length
  ) {
    return null;
  }

  const taskResults = value.taskResults.map(mapTaskResult);

  if (taskResults.some((taskResult) => taskResult === null)) return null;

  const mappedTaskResults = taskResults as PublicRuntimeTaskResult[];
  const resultTaskIds = new Set(
    mappedTaskResults.map((taskResult) => taskResult.taskId)
  );
  const questTaskIds = new Set(quest.tasks.map((task) => task.id));
  const statusCounts = {
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    not_scored: 0,
  };

  for (const taskResult of mappedTaskResults) {
    statusCounts[taskResult.status] += 1;
  }

  if (
    resultTaskIds.size !== mappedTaskResults.length ||
    resultTaskIds.size !== questTaskIds.size ||
    [...resultTaskIds].some((taskId) => !questTaskIds.has(taskId)) ||
    statusCounts.correct !== value.correctCount ||
    statusCounts.incorrect !== value.incorrectCount ||
    statusCounts.unanswered !== value.unansweredCount ||
    statusCounts.not_scored !== value.notScoredCount
  ) {
    return null;
  }

  return {
    earnedPoints: value.earnedPoints,
    possiblePoints: value.possiblePoints,
    correctCount: value.correctCount,
    incorrectCount: value.incorrectCount,
    unansweredCount: value.unansweredCount,
    notScoredCount: value.notScoredCount,
    taskResults: mappedTaskResults,
  };
}

export function PublicQuestTransition({
  questTitle,
  narrativeSuccess,
  currentTaskIndex,
  taskCount,
  onContinue,
}: {
  questTitle: string;
  narrativeSuccess: string;
  currentTaskIndex: number;
  taskCount: number;
  onContinue: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl">
      <section className="rounded-lg border border-violet-500/30 bg-[#111827] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
          Путь
        </p>
        <h1 className="mt-3 text-2xl font-bold text-white">{questTitle}</h1>
        <p className="mt-6 text-sm text-slate-400">
          Этап {currentTaskIndex + 1} из {taskCount}
        </p>
        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-200">
          {narrativeSuccess}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-8 rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Продолжить путь
        </button>
      </section>
    </main>
  );
}

export default function PublicQuestRunner({
  quest,
  submitUrl,
  retryHref,
  catalogHref,
}: PublicQuestRunnerProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<
    Record<string, string>
  >({});
  const [selectedMultipleChoiceOptionIds, setSelectedMultipleChoiceOptionIds] =
    useState<Record<string, string[]>>({});
  const [phase, setPhase] = useState<PublicQuestRunnerPhase>(() =>
    getInitialPublicQuestRunnerPhase(quest)
  );
  const [result, setResult] = useState<PublicRuntimeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const taskContainerRef = useRef<HTMLElement>(null);
  const shouldPositionTaskRef = useRef(true);
  const taskScrollBehaviorRef = useRef<ScrollBehavior>("auto");
  const submissionInFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const questIsValid = useMemo(() => isValidQuest(quest), [quest]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      submissionInFlightRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "active" || !shouldPositionTaskRef.current) return;

    const taskContainer = taskContainerRef.current;

    if (!taskContainer) return;

    taskContainer.scrollIntoView({
      behavior: taskScrollBehaviorRef.current,
      block: "start",
    });
    taskContainer.focus({ preventScroll: true });
    shouldPositionTaskRef.current = false;
  }, [currentTaskIndex, phase]);

  if (!questIsValid) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-6 text-slate-200">
        {unavailableQuestMessage}
      </section>
    );
  }

  const currentTask = quest.tasks[currentTaskIndex];

  if (!currentTask) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-6 text-slate-200">
        {unavailableQuestMessage}
      </section>
    );
  }

  const isSubmitting = phase === "submitting";
  const isFinalTask = currentTaskIndex === quest.tasks.length - 1;
  const taskNarrativeIntro = getTaskNarrativeIntro(currentTask);
  const taskNarrativeSuccess = getTaskNarrativeSuccess(currentTask);
  const missionIntro = getMissionIntro(quest);

  function positionCurrentTask() {
    taskScrollBehaviorRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
      ? "auto"
      : "smooth";
    shouldPositionTaskRef.current = true;
  }

  function moveToTask(index: number) {
    if (isSubmitting || index < 0 || index >= quest.tasks.length) return;

    positionCurrentTask();
    setCurrentTaskIndex(index);
    setPhase("active");
  }

  function startMission() {
    positionCurrentTask();
    setPhase("active");
  }

  function advanceCurrentTask() {
    if (isSubmitting) return;

    if (shouldShowPublicQuestTransition(currentTask, isFinalTask)) {
      setPhase("transition");
      return;
    }

    moveToTask(currentTaskIndex + 1);
  }

  function selectOption(optionId: string) {
    if (isSubmitting || currentTask.taskType !== "single_choice") return;

    setSelectedOptionIds((current) => ({
      ...current,
      [currentTask.id]: optionId,
    }));
  }

  function toggleOption(optionId: string) {
    if (isSubmitting || currentTask.taskType !== "multiple_choice") return;

    setSelectedMultipleChoiceOptionIds((current) => {
      const selected = current[currentTask.id] ?? [];
      return {
        ...current,
        [currentTask.id]: selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId],
      };
    });
  }

  function resetRunner() {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    submissionInFlightRef.current = false;
    positionCurrentTask();
    setCurrentTaskIndex(0);
    setSelectedOptionIds({});
    setSelectedMultipleChoiceOptionIds({});
    setPhase(getInitialPublicQuestRunnerPhase(quest));
    setResult(null);
    setErrorMessage(null);
  }

  async function submit() {
    if (isSubmitting || submissionInFlightRef.current) return;

    submissionInFlightRef.current = true;
    const requestId = requestIdRef.current + 1;
    const controller = new AbortController();

    requestIdRef.current = requestId;
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    const submission = createPublicRuntimeSubmission(
      quest,
      selectedOptionIds,
      selectedMultipleChoiceOptionIds
    );
    setPhase("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(
        submitUrl ?? `/api/public/quests/${quest.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submission),
          cache: "no-store",
          signal: controller.signal,
        }
      );
      const payload: unknown = await response.json();

      if (!response.ok || !isPlainObject(payload)) {
        throw new Error("Public runtime submission failed.");
      }

      const mappedResult = mapResult(payload.result, quest);

      if (!mappedResult) {
        throw new Error("Public runtime submission failed.");
      }

      if (!mountedRef.current || requestIdRef.current !== requestId) return;

      setResult(mappedResult);
      setPhase("completed");
    } catch {
      if (
        !mountedRef.current ||
        requestIdRef.current !== requestId ||
        controller.signal.aborted
      ) {
        return;
      }

      setPhase("submission_error");
      setErrorMessage(submissionErrorMessage);
    } finally {
      if (requestIdRef.current === requestId) {
        submissionInFlightRef.current = false;
      }

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  if (phase === "completed" && result) {
    return (
      <PublicQuestResults
        quest={quest}
        result={result}
        onRetry={resetRunner}
        retryHref={retryHref}
        catalogHref={catalogHref}
      />
    );
  }

  if (phase === "mission" && missionIntro) {
    return (
      <main className="mx-auto max-w-3xl">
        <section className="rounded-lg border border-violet-500/30 bg-[#111827] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
            Квест
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">{quest.title}</h1>
          <h2 className="mt-8 text-xl font-semibold text-violet-100">
            Твоя миссия
          </h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-200">
            {missionIntro}
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Этапов: {quest.tasks.length}
          </p>
          <button
            type="button"
            onClick={startMission}
            className="mt-8 rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Начать миссию
          </button>
        </section>
      </main>
    );
  }

  if (phase === "transition" && taskNarrativeSuccess) {
    return (
      <PublicQuestTransition
        questTitle={quest.title}
        narrativeSuccess={taskNarrativeSuccess}
        currentTaskIndex={currentTaskIndex}
        taskCount={quest.tasks.length}
        onContinue={() => moveToTask(currentTaskIndex + 1)}
      />
    );
  }

  const progressPercent = ((currentTaskIndex + 1) / quest.tasks.length) * 100;

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-lg border border-slate-800 bg-[#111827] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
          Квест
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">{quest.title}</h1>
        {quest.description ? (
          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
            {quest.description}
          </p>
        ) : null}
        <div className="mt-6" aria-live="polite">
          <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
            <span>
              Путь · Этап {currentTaskIndex + 1} из {quest.tasks.length}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-violet-600 transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Прогресс не сохраняется после обновления страницы
        </p>
      </header>

      <section
        ref={taskContainerRef}
        tabIndex={-1}
        className="scroll-mt-6 rounded-lg border border-slate-800 bg-[#111827] p-6 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-8"
      >
        {taskNarrativeIntro ? (
          <aside className="mb-6 rounded-md border border-violet-500/30 bg-violet-500/10 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-200">
              Сцена
            </h2>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-200">
              {taskNarrativeIntro}
            </p>
          </aside>
        ) : null}
        <PublicTaskRenderer
          task={currentTask}
          selectedOptionId={selectedOptionIds[currentTask.id]}
          selectedOptionIds={
            selectedMultipleChoiceOptionIds[currentTask.id] ?? []
          }
          disabled={isSubmitting}
          onSelectOption={selectOption}
          onToggleOption={toggleOption}
        />
      </section>

      {isSubmitting ? (
        <p role="status" aria-live="polite" className="text-sm text-slate-300">
          Проверяем ответы...
        </p>
      ) : null}
      {phase === "submission_error" && errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {errorMessage}
        </p>
      ) : null}

      <nav
        className="flex flex-wrap items-center justify-between gap-3"
        aria-label="Навигация по заданиям"
      >
        <button
          type="button"
          onClick={() => moveToTask(currentTaskIndex - 1)}
          disabled={isSubmitting || currentTaskIndex === 0}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Назад
        </button>
        {isFinalTask ? (
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "submission_error" ? "Повторить" : "Завершить"}
          </button>
        ) : (
          <button
            type="button"
            onClick={advanceCurrentTask}
            disabled={isSubmitting}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Далее
          </button>
        )}
      </nav>
    </main>
  );
}
