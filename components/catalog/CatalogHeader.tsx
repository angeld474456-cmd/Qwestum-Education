import SearchBar from "./SearchBar";
import CatalogFilters from "./CatalogFilters";

export default function CatalogHeader() {
  return (
    <>

      <div className="text-center">

        <div className="uppercase tracking-[0.3em] text-violet-400">
          QUESTUM MARKETPLACE
        </div>

        <h1 className="mt-6 text-6xl font-black">
          Каталог образовательных квестов
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-400">
          Более 300 готовых сценариев,
          полностью готовых к проведению уроков.
        </p>

      </div>

      <SearchBar />

      <CatalogFilters />

    </>
  );
}