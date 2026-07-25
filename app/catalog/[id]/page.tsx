import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublicQuestDetail from "@/components/catalog/PublicQuestDetail";
import { getPublicCatalogQuest } from "@/services/public-catalog.server";

type CatalogDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: CatalogDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const quest = await getPublicCatalogQuest(id);

    if (!quest) {
      return {
        title: "Квест недоступен",
      };
    }

    return {
      title: quest.title,
      description: quest.description ?? "Образовательный квест Questum.",
    };
  } catch {
    return {
      title: "Каталог квестов",
    };
  }
}

export default async function CatalogDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { id } = await params;
  const quest = await getPublicCatalogQuest(id);

  if (!quest) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <PublicQuestDetail quest={quest} />
    </main>
  );
}
