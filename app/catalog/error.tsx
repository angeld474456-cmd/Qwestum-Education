"use client";

import PublicCatalogState from "@/components/catalog/PublicCatalogState";

type CatalogErrorProps = {
  unstable_retry: () => void;
};

export default function CatalogError({ unstable_retry }: CatalogErrorProps) {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <PublicCatalogState
          tone="error"
          title={"\u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d"}
          description={"\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u043f\u043e\u0437\u0436\u0435."}
          onRetry={unstable_retry}
          focusHeading
        />
      </div>
    </main>
  );
}
