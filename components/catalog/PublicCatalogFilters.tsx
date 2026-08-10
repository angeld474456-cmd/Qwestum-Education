import Link from "next/link";

import type { PublicCatalogListQuery } from "@/types/public-catalog";

type PublicCatalogFiltersProps = {
  query: PublicCatalogListQuery;
};

const grades = Array.from({ length: 11 }, (_, index) => index + 1);
const difficulties = [1, 2, 3];

export default function PublicCatalogFilters({
  query,
}: PublicCatalogFiltersProps) {
  return (
    <form
      action="/catalog"
      className="grid gap-4 rounded-lg border border-slate-800 bg-[#111827] p-5 md:grid-cols-2 xl:grid-cols-5 xl:items-end"
    >
      <div>
        <label htmlFor="catalog-search" className="text-sm font-semibold text-slate-200">
          Поиск
        </label>
        <input
          id="catalog-search"
          name="search"
          type="search"
          defaultValue={query.search ?? ""}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      <div>
        <label htmlFor="catalog-subject" className="text-sm font-semibold text-slate-200">
          Предмет
        </label>
        <input
          id="catalog-subject"
          name="subject"
          type="text"
          defaultValue={query.subject ?? ""}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      <div>
        <label htmlFor="catalog-grade" className="text-sm font-semibold text-slate-200">
          Класс
        </label>
        <select
          id="catalog-grade"
          name="grade"
          defaultValue={query.grade?.toString() ?? ""}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        >
          <option value="">Все классы</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade} класс
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="catalog-difficulty" className="text-sm font-semibold text-slate-200">
          Сложность
        </label>
        <select
          id="catalog-difficulty"
          name="difficulty"
          defaultValue={query.difficulty?.toString() ?? ""}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        >
          <option value="">Любая</option>
          {difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          Применить
        </button>
        <Link
          href="/catalog"
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Сбросить
        </Link>
      </div>
    </form>
  );
}
