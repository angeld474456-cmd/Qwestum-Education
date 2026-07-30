"use client";

import { useState } from "react";

type PublicQuestCoverProps = {
  title: string;
  coverUrl: string | null;
  loading: "eager" | "lazy";
  className?: string;
};

export default function PublicQuestCover({
  title,
  coverUrl,
  loading,
  className,
}: PublicQuestCoverProps) {
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const hasFailed = coverUrl !== null && failedCoverUrl === coverUrl;

  const fallbackClassName =
    "flex aspect-video items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-4 text-center text-sm font-semibold text-slate-500";

  if (!coverUrl || hasFailed) {
    return (
      <div aria-hidden="true" className={className ?? fallbackClassName}>
        Questum
      </div>
    );
  }

  return (
    <div className={className ?? "aspect-video overflow-hidden rounded-md border border-slate-700 bg-slate-900"}>
      {/* The route validates and streams the image; native img enables one-shot fallback. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt={"\u041e\u0431\u043b\u043e\u0436\u043a\u0430 \u043a\u0432\u0435\u0441\u0442\u0430 \u00ab" + title + "\u00bb"}
        loading={loading}
        decoding="async"
        className="h-full w-full object-cover"
        onError={() => setFailedCoverUrl(coverUrl)}
      />
    </div>
  );
}
