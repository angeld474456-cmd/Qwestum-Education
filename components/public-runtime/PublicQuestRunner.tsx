"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  PublicRuntimeQuest,
  PublicRuntimeResult,
  PublicRuntimeSubmission,
  PublicRuntimeTaskResult,
  PublicRuntimeTaskStatus,
} from "@/types/public-runtime";

import PublicQuestResults from "./PublicQuestResults";
import PublicTaskRenderer from "./PublicTaskRenderer";

type PublicQuestRunnerProps = {
  quest: PublicRuntimeQuest;
};

type RunnerStatus = "active" | "submitting" | "completed" | "submission_error";
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
const unavailableQuestMessage =
  "\u041a\u0432\u0435\u0441\u0442 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0434\u043b\u044f \u043f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f";
const submissionErrorMessage =
  "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442\u044b. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437";

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

function isValidQuest(quest: PublicRuntimeQuest) {
  if (!Array.isArray(quest.tasks) || quest.tasks.length < 1 || quest.tasks.length > MAX_TASKS) {
    return false;
  }

  const taskIds = new Set<string>();

  for (const task of quest.tasks) {
    if (!isUuid(task.id) || taskIds.has(task.id)) return false;

    taskIds.add(task.id);

    if (task.taskType === "text") continue;

    if (
      (task.taskType !== "single_choice" && task.taskType !== "multiple_choice") ||
      !Array.isArray(task.options) ||
      task.options.length < 2 ||
      task.options.length > MAX_TASKS
    ) {
      return false;
    }

    const optionIds = new Set<string>();

    for (const option of task.options) {
      if (typeof option.id !== "string" || option.id.length === 0 || optionIds.has(option.id)) {
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

function mapResult(value: unknown, quest: PublicRuntimeQuest): PublicRuntimeResult | null {
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
  const resultTaskIds = new Set(mappedTaskResults.map((taskResult) => taskResult.taskId));
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

export default function PublicQuestRunner({ quest }: PublicQuestRunnerProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});
  const [selectedMultipleChoiceOptionIds, setSelectedMultipleChoiceOptionIds] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<RunnerStatus>("active");
  const [result, setResult] = useState<PublicRuntimeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const taskContainerRef = useRef<HTMLElement>(null);
  const focusTaskOnChangeRef = useRef(false);
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
    if (!focusTaskOnChangeRef.current) return;

    taskContainerRef.current?.focus();
    focusTaskOnChangeRef.current = false;
  }, [currentTaskIndex]);

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

  const isSubmitting = status === "submitting";
  const isFinalTask = currentTaskIndex === quest.tasks.length - 1;

  function moveToTask(index: number) {
    if (isSubmitting || index < 0 || index >= quest.tasks.length) return;

    focusTaskOnChangeRef.current = true;
    setCurrentTaskIndex(index);
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
      return { ...current, [currentTask.id]: selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId] };
    });
  }

  function resetRunner() {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    submissionInFlightRef.current = false;
    setCurrentTaskIndex(0);
    setSelectedOptionIds({});
    setSelectedMultipleChoiceOptionIds({});
    setStatus("active");
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

    const submission: PublicRuntimeSubmission = {
      answers: quest.tasks.map((task) => {
        const selectedOptionId = selectedOptionIds[task.id];
        const selectedOptionIdsForTask = selectedMultipleChoiceOptionIds[task.id];

        return task.taskType === "single_choice" && selectedOptionId
          ? { taskId: task.id, selectedOptionId }
          : task.taskType === "multiple_choice" && selectedOptionIdsForTask && selectedOptionIdsForTask.length > 0
            ? { taskId: task.id, selectedOptionIds: selectedOptionIdsForTask }
          : { taskId: task.id };
        }),
    };
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/public/quests/${quest.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        cache: "no-store",
        signal: controller.signal,
      });
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
      setStatus("completed");
    } catch {
      if (!mountedRef.current || requestIdRef.current !== requestId || controller.signal.aborted) {
        return;
      }

      setStatus("submission_error");
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

  if (status === "completed" && result) {
    return <PublicQuestResults quest={quest} result={result} onRetry={resetRunner} />;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-lg border border-slate-800 bg-[#111827] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
          {"\u041f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u0435 \u043a\u0432\u0435\u0441\u0442\u0430"}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">{quest.title}</h1>
        {quest.description ? (
          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
            {quest.description}
          </p>
        ) : null}
        <p className="mt-6 text-sm text-slate-300" aria-live="polite">
          {"\u0417\u0430\u0434\u0430\u043d\u0438\u0435"} {currentTaskIndex + 1} {"\u0438\u0437"} {quest.tasks.length}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {"\u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b"}
        </p>
      </header>

      <section
        ref={taskContainerRef}
        tabIndex={-1}
        className="rounded-lg border border-slate-800 bg-[#111827] p-6 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-8"
      >
        <PublicTaskRenderer
          task={currentTask}
          selectedOptionId={selectedOptionIds[currentTask.id]}
          selectedOptionIds={selectedMultipleChoiceOptionIds[currentTask.id] ?? []}
          disabled={isSubmitting}
          onSelectOption={selectOption}
          onToggleOption={toggleOption}
        />
      </section>

      {isSubmitting ? (
        <p role="status" aria-live="polite" className="text-sm text-slate-300">
          {"\u041f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u043c \u043e\u0442\u0432\u0435\u0442\u044b..."}
        </p>
      ) : null}
      {status === "submission_error" && errorMessage ? (
        <p role="alert" className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </p>
      ) : null}

      <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f \u043f\u043e \u0437\u0430\u0434\u0430\u043d\u0438\u044f\u043c">
        <button type="button" onClick={() => moveToTask(currentTaskIndex - 1)} disabled={isSubmitting || currentTaskIndex === 0} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
          {"\u041d\u0430\u0437\u0430\u0434"}
        </button>
        {isFinalTask ? (
          <button type="button" onClick={submit} disabled={isSubmitting} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
            {status === "submission_error" ? "\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c" : "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c"}
          </button>
        ) : (
          <button type="button" onClick={() => moveToTask(currentTaskIndex + 1)} disabled={isSubmitting} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
            {"\u0414\u0430\u043b\u0435\u0435"}
          </button>
        )}
      </nav>
    </main>
  );
}
