import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const items = [
  { title: "Для преподавателей", text: "Создавайте задания, проверяйте квест в Preview и публикуйте ссылку для учеников." },
  { title: "Для учеников", text: "Проходите интерактивные задания, получайте результат и возвращайтесь к истории прохождений." },
];

export default function Statistics() {
  return (
    <section className="pb-16 sm:pb-24">
      <Container>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.title}>
              <h2 className="text-2xl font-bold text-violet-200">{item.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
