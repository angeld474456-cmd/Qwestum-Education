"use client";

import { useEffect, useRef, useState } from "react";

import {
  isSessionExpiredResponse,
  redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";

type QuestPublicationReadinessProps = {
  questId: string;
};

type PublicationIssueView = {
  message: string;
};

type PublicationReadinessView = {
  ready: boolean;
  blockers: PublicationIssueView[];
  warnings: PublicationIssueView[];
  taskCount: number;
  supportedTaskCount: number;
};

type RequestError = "unavailable" | "failed" | "session";

function isPlainObject(value: unknown): value is object {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getOwnValue(value: object, key: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(value, key)) {
    return undefined;
  }

  return Reflect.get(value, key);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseIssue(value: unknown): PublicationIssueView | null {
  if (!isPlainObject(value)) return null;

  const code = getOwnValue(value, "code");
  const message = getOwnValue(value, "message");
  const taskId = getOwnValue(value, "taskId");
  const field = getOwnValue(value, "field");

  if (typeof code !== "string" || typeof message !== "string") {
    return null;
  }

  if (
    (taskId !== undefined && typeof taskId !== "string") ||
    (field !== undefined && typeof field !== "string")
  ) {
    return null;
  }

  return { message };
}

function parseIssues(value: unknown): PublicationIssueView[] | null {
  if (!Array.isArray(value)) return null;

  const issues: PublicationIssueView[] = [];

  for (const item of value) {
    const issue = parseIssue(item);
    if (!issue) return null;
    issues.push(issue);
  }

  return issues;
}

function parsePublicationReadiness(
  value: unknown,
): PublicationReadinessView | null {
  if (!isPlainObject(value)) return null;

  const ready = getOwnValue(value, "ready");
  const blockers = parseIssues(getOwnValue(value, "blockers"));
  const warnings = parseIssues(getOwnValue(value, "warnings"));
  const taskCount = getOwnValue(value, "taskCount");
  const supportedTaskCount = getOwnValue(value, "supportedTaskCount");

  if (
    typeof ready !== "boolean" ||
    !blockers ||
    !warnings ||
    !isNonNegativeInteger(taskCount) ||
    !isNonNegativeInteger(supportedTaskCount)
  ) {
    return null;
  }

  return { ready, blockers, warnings, taskCount, supportedTaskCount };
}

function getErrorMessage(error: RequestError) {
  switch (error) {
    case "session":
      return SESSION_EXPIRED_MESSAGE;
    case "unavailable":
      return "Quest publication readiness is unavailable.";
    case "failed":
      return "Unable to check publication readiness.";
  }
}

export default function QuestPublicationReadiness({
  questId,
}: QuestPublicationReadinessProps) {
  const [readiness, setReadiness] = useState<PublicationReadinessView | null>(
    null,
  );
  const [requestError, setRequestError] = useState<RequestError | null>(null);
  const [checking, setChecking] = useState(false);
  const isMountedRef = useRef(true);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function checkReadiness() {
    if (requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    setChecking(true);
    setReadiness(null);
    setRequestError(null);

    try {
      const response = await fetch(
        `/api/teacher/quests/${encodeURIComponent(questId)}/publication-readiness`,
        { headers: { Accept: "application/json" } },
      );

      if (isSessionExpiredResponse(response)) {
        if (isMountedRef.current) {
          setRequestError("session");
        }
        redirectToSessionExpiredLogin();
        return;
      }

      if (response.status === 404) {
        if (isMountedRef.current) {
          setRequestError("unavailable");
        }
        return;
      }

      if (!response.ok) {
        if (isMountedRef.current) {
          setRequestError("failed");
        }
        return;
      }

      const payload: unknown = await response.json();
      const nextReadiness = parsePublicationReadiness(payload);

      if (!nextReadiness) {
        if (isMountedRef.current) {
          setRequestError("failed");
        }
        return;
      }

      if (isMountedRef.current) {
        setReadiness(nextReadiness);
      }
    } catch {
      if (isMountedRef.current) {
        setRequestError("failed");
      }
    } finally {
      requestInFlightRef.current = false;
      if (isMountedRef.current) {
        setChecking(false);
      }
    }
  }

  const hasWarnings = (readiness?.warnings.length ?? 0) > 0;
  const buttonLabel = checking
    ? "Checking readiness…"
    : requestError
      ? "Retry"
      : readiness
        ? "Check again"
        : "Check publication readiness";

  return (
    <section
      aria-labelledby="publication-readiness-heading"
      className="border-t border-slate-800 pt-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="publication-readiness-heading" className="font-semibold text-white">
          Publication readiness
        </h2>
        <button
          type="button"
          onClick={checkReadiness}
          disabled={checking}
          aria-busy={checking}
          className="rounded-xl border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>

      {requestError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {getErrorMessage(requestError)}
        </p>
      ) : null}

      {readiness ? (
        <div aria-live="polite" className="mt-4 space-y-4">
          <p
            className={`text-sm font-semibold ${
              readiness.ready
                ? hasWarnings
                  ? "text-amber-200"
                  : "text-emerald-200"
                : "text-red-200"
            }`}
          >
            {readiness.ready
              ? hasWarnings
                ? "Ready for publication with recommendations"
                : "Ready for publication"
              : "Not ready for publication"}
          </p>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-800/60 px-3 py-2">
              <dt className="text-slate-400">Tasks</dt>
              <dd className="mt-1 font-semibold text-white">
                {readiness.taskCount}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-800/60 px-3 py-2">
              <dt className="text-slate-400">Supported tasks</dt>
              <dd className="mt-1 font-semibold text-white">
                {readiness.supportedTaskCount}
              </dd>
            </div>
          </dl>

          {readiness.blockers.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-red-200">Blockers</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {readiness.blockers.map((issue, index) => (
                  <li key={`${issue.message}-${index}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {readiness.warnings.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-amber-200">
                Recommendations
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {readiness.warnings.map((issue, index) => (
                  <li key={`${issue.message}-${index}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
