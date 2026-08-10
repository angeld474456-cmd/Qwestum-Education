"use client";

import { useRef, useState } from "react";

import {
  isSessionExpiredResponse,
  redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getDuplicateQuestId(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const id = Object.prototype.hasOwnProperty.call(value, "id")
    ? (value as { id?: unknown }).id
    : undefined;

  return typeof id === "string" && uuidPattern.test(id) ? id : null;
}

export default function QuestDuplicateButton({ questId }: { questId: string }) {
  const inFlightRef = useRef(false);
  const [duplicating, setDuplicating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function duplicateQuest() {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setDuplicating(true);
    setErrorMessage(null);
    let navigationStarted = false;

    try {
      const response = await fetch(
        `/api/teacher/quests/${encodeURIComponent(questId)}/duplicate`,
        { method: "POST" }
      );

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        navigationStarted = true;
        redirectToSessionExpiredLogin();
        return;
      }

      let payload: unknown = null;

      try {
        payload = await response.json();
      } catch {
        // All failed or malformed responses use fixed feedback below.
      }

      const duplicateId = response.ok ? getDuplicateQuestId(payload) : null;

      if (!duplicateId) {
        setErrorMessage("Unable to duplicate quest.");
        return;
      }

      navigationStarted = true;
      window.location.assign(`/dashboard/quests/${duplicateId}/settings`);
    } catch {
      setErrorMessage("Unable to duplicate quest.");
    } finally {
      if (!navigationStarted) {
        inFlightRef.current = false;
        setDuplicating(false);
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={duplicateQuest}
        disabled={duplicating}
        className="rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {duplicating ? "Duplicating..." : "Duplicate"}
      </button>
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
