import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-20">

      <Container>

        <div className="grid gap-12 md:grid-cols-4">

          <div>

            <h3 className="text-3xl font-black text-violet-400">
              QUESTUM
            </h3>

            <p className="mt-6 leading-8 text-gray-400">
              AI-платформа образовательных квестов
              нового поколения.
            </p>

          </div>

          <div>

            <h4 className="font-bold">
              Платформа
            </h4>

            <ul className="mt-6 space-y-3 text-gray-400">
              <li>Каталог</li>
              <li>AI</li>
              <li>Учителям</li>
              <li>Школам</li>
            </ul>

          </div>

          <div>

            <h4 className="font-bold">
              Компания
            </h4>

            <ul className="mt-6 space-y-3 text-gray-400">
              <li>О проекте</li>
              <li>Контакты</li>
              <li>Новости</li>
            </ul>

          </div>

          <div>

            <h4 className="font-bold">
              Поддержка
            </h4>

            <ul className="mt-6 space-y-3 text-gray-400">
              <li>Помощь</li>
              <li>Документация</li>
              <li>Политика</li>
            </ul>

          </div>

        </div>

        <div className="mt-20 border-t border-white/10 pt-8 text-center text-gray-500">
          © 2026 Questum Education. Все права защищены.
        </div>

      </Container>

    </footer>
  );
}