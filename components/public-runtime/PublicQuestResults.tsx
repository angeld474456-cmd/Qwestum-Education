"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type {
  PublicRuntimeQuest,
  PublicRuntimeResult,
  PublicRuntimeTaskStatus,
} from "@/types/public-runtime";

type PublicQuestResultsProps = {
  quest: PublicRuntimeQuest;
  result: PublicRuntimeResult;
  onRetry: () => void;
};

const statusLabels: Record<PublicRuntimeTaskStatus, string> = {
  correct: "\u0412\u0435\u0440\u043d\u043e",
  incorrect: "\u041d\u0435\u0432\u0435\u0440\u043d\u043e",
  unanswered: "\u0411\u0435\u0437 \u043e\u0442\u0432\u0435\u0442\u0430",
  not_scored: "\u041d\u0435 \u043e\u0446\u0435\u043d\u0438\u0432\u0430\u0435\u0442\u0441\u044f",
};

export default function PublicQuestResults({
  quest,
  result,
  onRetry,
}: PublicQuestResultsProps) {
  const resultsRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultsByTaskId = new Map(
    result.taskResults.map((taskResult) => [taskResult.taskId, taskResult])
  );

  useEffect(() => {
    resultsRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      ref={resultsRef}
      className="scroll-mt-6 mx-auto max-w-3xl space-y-6"
      aria-labelledby="public-runtime-results-heading"
    >
      <div className="rounded-lg border border-slate-800 bg-[#111827] p-6 sm:p-8">
        <h1
          id="public-runtime-results-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {"\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442"}
        </h1>
        {result.possiblePoints > 0 ? (
          <p className="mt-4 text-lg text-slate-200">
            {"\u0411\u0430\u043b\u043b\u044b"}: {result.earnedPoints} / {result.possiblePoints}
          </p>
        ) : (
          <p className="mt-4 text-slate-300">
            {"\u0412 \u044d\u0442\u043e\u043c \u043a\u0432\u0435\u0441\u0442\u0435 \u043d\u0435\u0442 \u0437\u0430\u0434\u0430\u043d\u0438\u0439 \u0441 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0439 \u043e\u0446\u0435\u043d\u043a\u043e\u0439"}
          </p>
        )}
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">{"\u0412\u0435\u0440\u043d\u043e"}</dt><dd className="mt-1 text-2xl font-bold text-white">{result.correctCount}</dd></div>
          <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">{"\u041d\u0435\u0432\u0435\u0440\u043d\u043e"}</dt><dd className="mt-1 text-2xl font-bold text-white">{result.incorrectCount}</dd></div>
          <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">{"\u0411\u0435\u0437 \u043e\u0442\u0432\u0435\u0442\u0430"}</dt><dd className="mt-1 text-2xl font-bold text-white">{result.unansweredCount}</dd></div>
          <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">{"\u041d\u0435 \u043e\u0446\u0435\u043d\u0438\u0432\u0430\u0435\u0442\u0441\u044f"}</dt><dd className="mt-1 text-2xl font-bold text-white">{result.notScoredCount}</dd></div>
        </dl>
      </div>

      <ol className="space-y-3">
        {quest.tasks.map((task) => {
          const taskResult = resultsByTaskId.get(task.id);

          if (!taskResult) return null;

          return (
            <li key={task.id} className="rounded-lg border border-slate-800 bg-[#111827] p-4">
              <p className="font-semibold text-white">{task.title}</p>
              <p className="mt-1 text-sm text-slate-400">{statusLabels[taskResult.status]}</p>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
          {"\u041f\u0440\u043e\u0439\u0442\u0438 \u0435\u0449\u0451 \u0440\u0430\u0437"}
        </button>
        <Link href={`/catalog/${quest.id}`} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
          {"\u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043a \u043a\u0432\u0435\u0441\u0442\u0443"}
        </Link>
        <Link href="/catalog" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
          {"\u0412 \u043a\u0430\u0442\u0430\u043b\u043e\u0433"}
        </Link>
      </div>
    </section>
  );
}
