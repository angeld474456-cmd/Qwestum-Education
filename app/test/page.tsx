import { supabase } from "@/lib/supabase";

export default async function TestPage() {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-10">
      <h1 className="text-3xl font-bold mb-8">
        Проверка подключения Supabase
      </h1>

      {error ? (
        <pre className="text-red-400">
          {JSON.stringify(error, null, 2)}
        </pre>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}