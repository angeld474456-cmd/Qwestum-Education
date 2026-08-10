"use client";

import PublicCatalogState from "@/components/catalog/PublicCatalogState";

type PublicQuestStartErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function PublicQuestStartError({
  unstable_retry,
}: PublicQuestStartErrorProps) {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <PublicCatalogState
          tone="error"
          title={"\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043a\u0432\u0435\u0441\u0442"}
          description={"\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0443 \u0438\u043b\u0438 \u0432\u0435\u0440\u043d\u0438\u0442\u0435\u0441\u044c \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433."}
          onRetry={unstable_retry}
          actions={[{ href: "/catalog", label: "\u0412 \u043a\u0430\u0442\u0430\u043b\u043e\u0433" }]}
          focusHeading
        />
      </div>
    </main>
  );
}
