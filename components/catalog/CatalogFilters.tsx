const grades = [
  "Все",
  "5 класс",
  "6 класс",
  "7 класс",
  "8 класс",
  "9 класс",
  "10 класс",
  "11 класс",
];

export default function CatalogFilters() {
  return (
    <div className="mt-10 flex flex-wrap gap-4">

      {grades.map((grade) => (

        <button
          key={grade}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 transition hover:bg-violet-600"
        >
          {grade}
        </button>

      ))}

    </div>
  );
}