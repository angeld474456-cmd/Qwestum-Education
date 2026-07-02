import { Button } from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute left-[-200px] top-[-200px] h-[500px] w-[500px] rounded-full bg-violet-700/20 blur-3xl"></div>

      <div className="absolute right-[-250px] bottom-[-200px] h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-3xl"></div>

      <Container>
        <div className="flex min-h-[90vh] flex-col items-center justify-center text-center">
          <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2 text-violet-300">
            AI Education Platform
          </div>

          <h1 className="mt-10 text-7xl font-black leading-tight lg:text-8xl">
            QUESTUM
          </h1>

          <h2 className="mt-8 max-w-4xl text-3xl font-semibold leading-relaxed text-gray-200">
            Будущее образования начинается сегодня
          </h2>

          <p className="mt-8 max-w-3xl text-xl leading-9 text-gray-400">
            Создавайте образовательные квесты, используйте искусственный интеллект,
            экономьте часы подготовки уроков и вовлекайте учеников через игру.
          </p>

          <div className="mt-14 flex flex-wrap justify-center gap-5">
            <Button>
              Попробовать бесплатно
            </Button>

            <Button variant="secondary">
              Смотреть демо
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}