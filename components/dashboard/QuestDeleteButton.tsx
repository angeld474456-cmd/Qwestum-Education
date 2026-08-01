"use client";

import { useRef, useState } from "react";

import {
  isSessionExpiredResponse,
  redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";

type QuestDeleteButtonProps = {
  questId: string;
  questTitle: string;
  isPublic: boolean;
};

export default function QuestDeleteButton({
  questId,
  questTitle,
  isPublic,
}: QuestDeleteButtonProps) {
  const inFlightRef = useRef(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const confirmationMatches = confirmation === questTitle;

  async function deleteQuest() {
    if (inFlightRef.current || !confirmationMatches) return;

    inFlightRef.current = true;
    setDeleting(true);
    setErrorMessage(null);
    let navigationStarted = false;

    try {
      const response = await fetch(
        `/api/teacher/quests/${encodeURIComponent(questId)}`,
        { method: "DELETE" }
      );

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        navigationStarted = true;
        redirectToSessionExpiredLogin();
        return;
      }

      if (response.status !== 204) {
        setErrorMessage("Unable to delete quest.");
        return;
      }

      navigationStarted = true;
      window.location.assign("/dashboard/quests");
    } catch {
      setErrorMessage("Unable to delete quest.");
    } finally {
      if (!navigationStarted) {
        inFlightRef.current = false;
        setDeleting(false);
      }
    }
  }

  return (
    <section
      aria-labelledby="quest-delete-heading"
      aria-busy={deleting}
      className="rounded-xl border border-red-500/40 bg-red-500/10 p-6"
    >
      <h2 id="quest-delete-heading" className="text-xl font-bold text-red-100">
        Delete quest
      </h2>
      <p className="mt-2 text-sm text-red-100/90">
        This permanently deletes the quest and all of its tasks.
      </p>
      {isPublic ? (
        <p className="mt-2 text-sm text-red-100/90">
          This quest is published. Its public catalog, detail, and start links
          will stop working.
        </p>
      ) : null}
      <label
        htmlFor="quest-delete-confirmation"
        className="mt-5 block text-sm font-semibold text-red-100"
      >
        Type the exact quest title shown below to confirm.
      </label>
      <code className="mt-2 block whitespace-pre-wrap rounded-lg border border-red-400/30 bg-slate-950 px-3 py-2 text-sm text-red-100">
        &ldquo;{questTitle}&rdquo;
      </code>
      <input
        id="quest-delete-confirmation"
        type="text"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        disabled={deleting}
        className="mt-2 w-full rounded-lg border border-red-400/50 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={deleteQuest}
          disabled={deleting || !confirmationMatches}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete quest permanently"}
        </button>
        {errorMessage ? (
          <p role="alert" className="text-sm text-red-100">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
