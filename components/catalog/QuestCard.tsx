import Card from "@/components/ui/Card";

type Quest = {
  title: string;
  subject: string;
  grade: string;
  price: number;
  description: string;
};

export default function QuestCard({
  title,
  subject,
  grade,
  price,
  description,
}: Quest) {
  return (
    <Card>

      <div className="aspect-video rounded-2xl bg-gradient-to-br from-violet-700 to-blue-600"></div>

      <div className="mt-8 flex gap-3">

        <span className="rounded-full bg-violet-600/20 px-3 py-1 text-sm">
          {subject}
        </span>

        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
          {grade}
        </span>

      </div>

      <h3 className="mt-6 text-3xl font-bold">
        {title}
      </h3>

      <p className="mt-5 leading-8 text-gray-400">
        {description}
      </p>

      <div className="mt-10 flex items-center justify-between">

        <div className="text-3xl font-black text-violet-400">
          {price.toLocaleString()} ₸
        </div>

        <button className="rounded-xl bg-violet-600 px-6 py-3 hover:bg-violet-500">
          Подробнее
        </button>

      </div>

    </Card>
  );
}