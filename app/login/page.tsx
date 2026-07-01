import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#070B14]">

      <div className="grid lg:grid-cols-2 min-h-screen">

        {/* Левая часть */}

        <section className="hidden lg:flex flex-col justify-center px-20 bg-gradient-to-br from-violet-700 via-[#10192D] to-[#070B14]">

          <h1 className="text-6xl font-black text-white">
            Questum
          </h1>

          <p className="text-2xl text-slate-300 mt-6 leading-relaxed">
            Создавайте современные образовательные квесты
            с помощью искусственного интеллекта.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-16">

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">300+</p>
              <p className="text-slate-300 mt-3">
                Готовых квестов
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">AI</p>
              <p className="text-slate-300 mt-3">
                Генерация уроков
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">PDF</p>
              <p className="text-slate-300 mt-3">
                Экспорт материалов
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">24/7</p>
              <p className="text-slate-300 mt-3">
                Доступ из любой точки мира
              </p>
            </div>

          </div>

        </section>

        {/* Правая часть */}

        <section className="flex items-center justify-center p-10">

          <LoginForm />

        </section>

      </div>

    </main>
  );
}