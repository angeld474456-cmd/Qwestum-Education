export default function SearchBar() {
  return (
    <div className="relative">

      <input
        type="text"
        placeholder="Поиск квестов..."
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-lg outline-none backdrop-blur transition focus:border-violet-500"
      />

    </div>
  );
}