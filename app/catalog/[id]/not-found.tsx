import PublicCatalogState from "@/components/catalog/PublicCatalogState";

export default function CatalogQuestNotFound() {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <PublicCatalogState
          tone="unavailable"
          title={"\u041a\u0432\u0435\u0441\u0442 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d"}
          description={"\u041a\u0432\u0435\u0441\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d \u0438\u043b\u0438 \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0435."}
          actions={[
            {
              href: "/catalog",
              label: "\u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043a \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0443",
              primary: true,
            },
          ]}
          focusHeading
        />
      </div>
    </main>
  );
}
