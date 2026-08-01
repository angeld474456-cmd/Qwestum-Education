"use client";

import { useEffect, useRef, useState } from "react";

import {
  isSessionExpiredResponse,
  redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";
import PublicQuestShareButton from "@/components/catalog/PublicQuestShareButton";
import { shouldShowPublicQuestShare } from "@/lib/public-quest-share";

type QuestPublicationReadinessProps = {
  questId: string;
  initialIsPublic: boolean;
  readinessInvalidationKey: number;
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

type VersionedReadiness = {
  value: PublicationReadinessView;
  invalidationKey: number;
};

type PublicationAction = "publish" | "unpublish";
type PublicationSuccessOutcome =
  | "published"
  | "already_published"
  | "unpublished"
  | "already_draft";
type PublicationFeedback = {
  tone: "success" | "error";
  message: string;
};

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

function parsePublicationSuccess(value: unknown): {
  isPublic: boolean;
  outcome: PublicationSuccessOutcome;
} | null {
  if (!isPlainObject(value)) return null;

  const publication = getOwnValue(value, "publication");
  if (!isPlainObject(publication)) return null;

  const isPublic = getOwnValue(publication, "isPublic");
  const outcome = getOwnValue(publication, "outcome");

  if (typeof isPublic !== "boolean" || typeof outcome !== "string") {
    return null;
  }

  if (
    (outcome === "published" || outcome === "already_published") &&
    isPublic
  ) {
    return { isPublic, outcome };
  }

  if (
    (outcome === "unpublished" || outcome === "already_draft") &&
    !isPublic
  ) {
    return { isPublic, outcome };
  }

  return null;
}

function readinessErrorMessage(status: "unavailable" | "failed" | "session") {
  switch (status) {
    case "session":
      return SESSION_EXPIRED_MESSAGE;
    case "unavailable":
      return "Quest publication readiness is unavailable.";
    case "failed":
      return "Unable to check publication readiness.";
  }
}

function publicationSuccessMessage(outcome: PublicationSuccessOutcome) {
  switch (outcome) {
    case "published":
      return "Quest published.";
    case "already_published":
      return "Quest is already published.";
    case "unpublished":
      return "Quest unpublished.";
    case "already_draft":
      return "Quest is already a draft.";
  }
}

function confirmationMessage(action: PublicationAction) {
  return action === "publish"
    ? "Publish this quest? It will become visible in the public catalog."
    : "Unpublish this quest? It will no longer be available publicly.";
}

export default function QuestPublicationReadiness({
  questId,
  initialIsPublic,
  readinessInvalidationKey,
}: QuestPublicationReadinessProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [readiness, setReadiness] = useState<VersionedReadiness | null>(null);
  const [readinessError, setReadinessError] = useState<
    "unavailable" | "failed" | "session" | null
  >(null);
  const [publicationFeedback, setPublicationFeedback] =
    useState<PublicationFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [mutationAction, setMutationAction] = useState<PublicationAction | null>(
    null,
  );
  const isMountedRef = useRef(true);
  const readinessInFlightRef = useRef(false);
  const mutationInFlightRef = useRef(false);
  const readinessAbortControllerRef = useRef<AbortController | null>(null);
  const mutationAbortControllerRef = useRef<AbortController | null>(null);
  const readinessRequestIdRef = useRef(0);
  const mutationRequestIdRef = useRef(0);
  const focusAfterMutationRef = useRef<"check" | "unpublish" | null>(null);
  const checkButtonRef = useRef<HTMLButtonElement>(null);
  const unpublishButtonRef = useRef<HTMLButtonElement>(null);

  const mutating = mutationAction !== null;
  const activeReadiness =
    readiness?.invalidationKey === readinessInvalidationKey
      ? readiness.value
      : null;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      readinessAbortControllerRef.current?.abort();
      mutationAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (mutating || !focusAfterMutationRef.current) return;

    const target = focusAfterMutationRef.current;
    focusAfterMutationRef.current = null;
    if (target === "unpublish") {
      unpublishButtonRef.current?.focus();
    } else {
      checkButtonRef.current?.focus();
    }
  }, [isPublic, mutating]);

  function abortReadinessRequest() {
    readinessRequestIdRef.current += 1;
    readinessAbortControllerRef.current?.abort();
    readinessAbortControllerRef.current = null;
    readinessInFlightRef.current = false;
    if (isMountedRef.current) {
      setChecking(false);
    }
  }

  async function checkReadiness() {
    if (readinessInFlightRef.current || mutationInFlightRef.current) return;

    const requestId = ++readinessRequestIdRef.current;
    const requestInvalidationKey = readinessInvalidationKey;
    const controller = new AbortController();
    readinessInFlightRef.current = true;
    readinessAbortControllerRef.current = controller;
    setChecking(true);
    setReadiness(null);
    setReadinessError(null);
    setPublicationFeedback(null);

    try {
      const response = await fetch(
        `/api/teacher/quests/${encodeURIComponent(questId)}/publication-readiness`,
        { headers: { Accept: "application/json" }, signal: controller.signal },
      );
      const isCurrent =
        readinessRequestIdRef.current === requestId &&
        readinessAbortControllerRef.current === controller;

      if (!isCurrent) return;

      if (isSessionExpiredResponse(response)) {
        if (isMountedRef.current) setReadinessError("session");
        redirectToSessionExpiredLogin();
        return;
      }

      if (response.status === 404) {
        if (isMountedRef.current) setReadinessError("unavailable");
        return;
      }

      if (!response.ok) {
        if (isMountedRef.current) setReadinessError("failed");
        return;
      }

      const payload: unknown = await response.json();
      const nextReadiness = parsePublicationReadiness(payload);
      if (!nextReadiness) {
        if (isMountedRef.current) setReadinessError("failed");
        return;
      }

      if (isMountedRef.current) {
        setReadiness({ value: nextReadiness, invalidationKey: requestInvalidationKey });
      }
    } catch (error) {
      if (
        isMountedRef.current &&
        !(error instanceof DOMException && error.name === "AbortError")
      ) {
        setReadinessError("failed");
      }
    } finally {
      if (
        readinessRequestIdRef.current === requestId &&
        readinessAbortControllerRef.current === controller
      ) {
        readinessInFlightRef.current = false;
        readinessAbortControllerRef.current = null;
        if (isMountedRef.current) setChecking(false);
      }
    }
  }

  async function updatePublication(action: PublicationAction) {
    if (mutationInFlightRef.current || readinessInFlightRef.current) return;
    if (
      action === "publish" &&
      (!activeReadiness || !activeReadiness.ready || isPublic)
    ) {
      return;
    }
    if (action === "unpublish" && !isPublic) return;
    if (!window.confirm(confirmationMessage(action))) return;

    const requestId = ++mutationRequestIdRef.current;
    const controller = new AbortController();
    mutationInFlightRef.current = true;
    mutationAbortControllerRef.current = controller;
    abortReadinessRequest();
    setMutationAction(action);
    setReadiness(null);
    setReadinessError(null);
    setPublicationFeedback(null);

    try {
      const response = await fetch(
        `/api/teacher/quests/${encodeURIComponent(questId)}/publication`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
          signal: controller.signal,
        },
      );
      const isCurrent =
        mutationRequestIdRef.current === requestId &&
        mutationAbortControllerRef.current === controller;

      if (!isCurrent) return;

      if (isSessionExpiredResponse(response)) {
        if (isMountedRef.current) {
          setPublicationFeedback({ tone: "error", message: SESSION_EXPIRED_MESSAGE });
        }
        redirectToSessionExpiredLogin();
        return;
      }

      if (response.status === 404) {
        if (isMountedRef.current) {
          setPublicationFeedback({
            tone: "error",
            message: "Quest publication is unavailable.",
          });
        }
        return;
      }

      if (response.status === 409) {
        if (isMountedRef.current) {
          setReadiness(null);
          setPublicationFeedback({
            tone: "error",
            message:
              "Quest is not ready for publication. Check readiness again before publishing.",
          });
        }
        return;
      }

      if (!response.ok) {
        if (isMountedRef.current) {
          setPublicationFeedback({
            tone: "error",
            message: "Unable to update publication state.",
          });
        }
        return;
      }

      const payload: unknown = await response.json();
      const publication = parsePublicationSuccess(payload);
      const isOutcomeForAction =
        publication &&
        (action === "publish"
          ? publication.outcome === "published" ||
            publication.outcome === "already_published"
          : publication.outcome === "unpublished" ||
            publication.outcome === "already_draft");

      if (!publication || !isOutcomeForAction) {
        if (isMountedRef.current) {
          setPublicationFeedback({
            tone: "error",
            message: "Unable to update publication state.",
          });
        }
        return;
      }

      if (isMountedRef.current) {
        setIsPublic(publication.isPublic);
        setReadiness(null);
        setPublicationFeedback({
          tone: "success",
          message: publicationSuccessMessage(publication.outcome),
        });
        focusAfterMutationRef.current =
          publication.isPublic ? "unpublish" : "check";
      }
    } catch (error) {
      if (
        isMountedRef.current &&
        !(error instanceof DOMException && error.name === "AbortError")
      ) {
        setPublicationFeedback({
          tone: "error",
          message: "Unable to update publication state.",
        });
      }
    } finally {
      if (
        mutationRequestIdRef.current === requestId &&
        mutationAbortControllerRef.current === controller
      ) {
        mutationInFlightRef.current = false;
        mutationAbortControllerRef.current = null;
        if (isMountedRef.current) setMutationAction(null);
      }
    }
  }

  const hasWarnings = (activeReadiness?.warnings.length ?? 0) > 0;
  const publishAvailable =
    !isPublic &&
    activeReadiness !== null &&
    activeReadiness.ready &&
    !checking &&
    !mutating;
  const readinessButtonLabel = checking
    ? "Checking readiness…"
    : readinessError
      ? "Retry"
      : activeReadiness
        ? "Check again"
        : "Check publication readiness";

  return (
    <section
      aria-labelledby="publication-readiness-heading"
      aria-busy={checking || mutating}
      className="border-t border-slate-800 pt-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="publication-readiness-heading" className="font-semibold text-white">
            Publication readiness
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Status: {isPublic ? "Published" : "Draft"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {shouldShowPublicQuestShare(isPublic) ? (
            <PublicQuestShareButton
              questId={questId}
              label="Copy public link"
              copiedMessage="Public link copied."
              failedMessage="Could not copy the public link."
              announceFeedback={false}
            />
          ) : null}
          <button
            ref={checkButtonRef}
            type="button"
            onClick={checkReadiness}
            disabled={checking || mutating}
            className="rounded-xl border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {readinessButtonLabel}
          </button>
        </div>
      </div>

      <div aria-live="polite" className="mt-4 space-y-4">
        {readinessError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {readinessErrorMessage(readinessError)}
          </p>
        ) : null}

        {publicationFeedback ? (
          <p
            role={publicationFeedback.tone === "error" ? "alert" : undefined}
            className={`rounded-lg px-4 py-3 text-sm ${
              publicationFeedback.tone === "success"
                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border border-red-500/40 bg-red-500/10 text-red-200"
            }`}
          >
            {publicationFeedback.message}
          </p>
        ) : null}

        {activeReadiness ? (
          <div className="space-y-4">
            <p
              className={`text-sm font-semibold ${
                activeReadiness.ready
                  ? hasWarnings
                    ? "text-amber-200"
                    : "text-emerald-200"
                  : "text-red-200"
              }`}
            >
              {activeReadiness.ready
                ? hasWarnings
                  ? "Ready for publication with recommendations"
                  : "Ready for publication"
                : "Not ready for publication"}
            </p>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                <dt className="text-slate-400">Tasks</dt>
                <dd className="mt-1 font-semibold text-white">
                  {activeReadiness.taskCount}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                <dt className="text-slate-400">Supported tasks</dt>
                <dd className="mt-1 font-semibold text-white">
                  {activeReadiness.supportedTaskCount}
                </dd>
              </div>
            </dl>

            {activeReadiness.blockers.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-red-200">Blockers</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {activeReadiness.blockers.map((issue, index) => (
                    <li key={`${issue.message}-${index}`}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {activeReadiness.warnings.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-amber-200">
                  Recommendations
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {activeReadiness.warnings.map((issue, index) => (
                    <li key={`${issue.message}-${index}`}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {!isPublic ? (
            <button
              type="button"
              onClick={() => updatePublication("publish")}
              disabled={!publishAvailable}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutationAction === "publish" ? "Publishing…" : "Publish quest"}
            </button>
          ) : (
            <button
              ref={unpublishButtonRef}
              type="button"
              onClick={() => updatePublication("unpublish")}
              disabled={mutating || checking}
              className="rounded-xl border border-amber-400/50 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutationAction === "unpublish" ? "Unpublishing…" : "Unpublish quest"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
