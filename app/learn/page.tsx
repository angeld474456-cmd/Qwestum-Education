import type { Metadata } from "next";

import PublicCatalogResults from "@/components/catalog/PublicCatalogResults";
import LearnerAttemptHistory from "@/components/learn/LearnerAttemptHistory";
import {
  parsePublicCatalogQuery,
  type PublicCatalogSearchParams,
} from "@/services/public-catalog-query";
import { listPublicCatalogQuests } from "@/services/public-catalog.server";
import { listStudentAttemptHistory } from "@/services/student-attempt-history.server";

export const metadata: Metadata = {
  title: "\u041c\u043e\u0438 \u043a\u0432\u0435\u0441\u0442\u044b",
};

type LearnPageProps = {
  searchParams: Promise<PublicCatalogSearchParams>;
};

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const query = parsePublicCatalogQuery(await searchParams);
  const result = await listPublicCatalogQuests(query);
  let history = null;

  try {
    history = await listStudentAttemptHistory();
  } catch {}

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
            Questum
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            {"\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u043a\u0432\u0435\u0441\u0442\u044b"}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            {"\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u0432\u0435\u0441\u0442 \u0438 \u043d\u0430\u0447\u043d\u0438\u0442\u0435 \u043f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u0435."}
          </p>
        </header>

        <PublicCatalogResults
          result={result}
          query={query}
          basePath="/learn"
          questHref={(questId) => `/learn/quests/${questId}/start`}
          disableQuestPrefetch
        />
        <LearnerAttemptHistory history={history} />
      </div>
    </main>
  );
}
