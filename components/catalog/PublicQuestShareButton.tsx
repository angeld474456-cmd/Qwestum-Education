"use client";

import { useState } from "react";

import { copyPublicQuestLink } from "@/lib/public-quest-share";

type PublicQuestShareButtonProps = {
  questId: string;
  label: string;
  copiedMessage: string;
  failedMessage: string;
  announceFeedback?: boolean;
};

export default function PublicQuestShareButton({
  questId,
  label,
  copiedMessage,
  failedMessage,
  announceFeedback = true,
}: PublicQuestShareButtonProps) {
  const [feedback, setFeedback] = useState<"copied" | "failed" | null>(null);
  const [copying, setCopying] = useState(false);

  async function copyLink() {
    if (copying) return;

    setCopying(true);
    setFeedback(null);

    const outcome = await copyPublicQuestLink(
      questId,
      window.location.origin,
      navigator.clipboard
    );

    setFeedback(outcome);
    setCopying(false);
  }

  const feedbackMessage = feedback === "copied" ? copiedMessage : failedMessage;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copyLink}
        disabled={copying}
        className="rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
      {feedback ? (
        <p
          {...(announceFeedback
            ? { role: "status", "aria-live": "polite", "aria-atomic": "true" }
            : {})}
          className={
            feedback === "copied" ? "text-sm text-emerald-200" : "text-sm text-red-200"
          }
        >
          {feedbackMessage}
        </p>
      ) : null}
    </div>
  );
}
