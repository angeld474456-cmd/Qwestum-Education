import type { Metadata } from "next";

import PublicCatalogFilters from "@/components/catalog/PublicCatalogFilters";
import PublicCatalogResults from "@/components/catalog/PublicCatalogResults";
import {
  parsePublicCatalogQuery,
  type PublicCatalogSearchParams,
} from "@/services/public-catalog-query";
import { listPublicCatalogQuests } from "@/services/public-catalog.server";

export const metadata: Metadata = {
  title: "Каталог квестов",
  description: "Открытый каталог образовательных квестов Questum.",
};

type CatalogPageProps = {
  searchParams: Promise<PublicCatalogSearchParams>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const query = parsePublicCatalogQuery(await searchParams);
  const result = await listPublicCatalogQuests(query);

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
            Questum
          </p>
          <h1 className="mt-3 text-4xl font-bold">Каталог квестов</h1>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            Открытые образовательные квесты для знакомства и выбора.
          </p>
        </header>

        <PublicCatalogFilters query={query} />
        <PublicCatalogResults result={result} query={query} />
      </div>
    </main>
  );
}
