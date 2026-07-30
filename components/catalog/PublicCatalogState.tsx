"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type PublicCatalogStateTone = "empty" | "error" | "loading" | "unavailable";

type PublicCatalogStateAction = {
  href: string;
  label: string;
  primary?: boolean;
};

type PublicCatalogStateProps = {
  title: string;
  description: string;
  tone: PublicCatalogStateTone;
  actions?: PublicCatalogStateAction[];
  onRetry?: () => void;
  retryLabel?: string;
  focusHeading?: boolean;
  headingLevel?: 1 | 2;
};

export default function PublicCatalogState({
  title,
  description,
  tone,
  actions = [],
  onRetry,
  retryLabel = "\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c",
  focusHeading = false,
  headingLevel = 1,
}: PublicCatalogStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isError = tone === "error";
  const Heading = headingLevel === 2 ? "h2" : "h1";

  useEffect(() => {
    if (focusHeading) {
      headingRef.current?.focus();
    }
  }, [focusHeading]);

  return (
    <section
      className="rounded-lg border border-slate-800 bg-[#111827] p-8 text-center"
      role={isError ? "alert" : "status"}
      aria-live={isError ? undefined : "polite"}
      aria-busy={tone === "loading" || undefined}
    >
      <Heading
        ref={headingRef}
        tabIndex={focusHeading ? -1 : undefined}
        className="text-2xl font-semibold text-white"
      >
        {title}
      </Heading>
      <p className="mt-3 text-slate-400">{description}</p>
      {onRetry || actions.length > 0 ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {retryLabel}
            </button>
          ) : null}
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400"
                  : "inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
