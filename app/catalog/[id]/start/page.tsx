import type { Metadata } from "next";
import Link from "next/link";

import PublicQuestRunner from "@/components/public-runtime/PublicQuestRunner";
import { getPublicRuntimeQuest } from "@/services/public-runtime.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "\u041f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u0435 \u043a\u0432\u0435\u0441\u0442\u0430",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function UnavailableQuest({ id }: { id: string }) {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-8 text-center">
        <h1 className="text-2xl font-semibold">
          {"\u041a\u0432\u0435\u0441\u0442 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0434\u043b\u044f \u043f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f"}
        </h1>
        <p className="mt-3 text-slate-400">
          {"\u0412\u043e\u0437\u043c\u043e\u0436\u043d\u043e, \u043a\u0432\u0435\u0441\u0442 \u0431\u044b\u043b \u0438\u0437\u043c\u0435\u043d\u0451\u043d \u0438\u043b\u0438 \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isUuid(id) ? (
            <Link href={`/catalog/${id}`} className="inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400">
              {"\u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043a \u043a\u0432\u0435\u0441\u0442\u0443"}
            </Link>
          ) : null}
          <Link href="/catalog" className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400">
            {"\u0412 \u043a\u0430\u0442\u0430\u043b\u043e\u0433"}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function PublicQuestStartPage({ params }: PageProps) {
  const { id } = await params;

  if (!isUuid(id)) return <UnavailableQuest id={id} />;

  const quest = await getPublicRuntimeQuest(id);

  if (!quest) return <UnavailableQuest id={id} />;

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <PublicQuestRunner quest={quest} />
    </main>
  );
}
