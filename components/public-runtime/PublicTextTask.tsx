import type { PublicRuntimeTextTask } from "@/types/public-runtime";

type PublicTextTaskProps = {
  task: PublicRuntimeTextTask;
};

export default function PublicTextTask({ task }: PublicTextTaskProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{task.title}</h2>
      {task.description ? (
        <p className="whitespace-pre-wrap leading-7 text-slate-300">
          {task.description}
        </p>
      ) : null}
      <p className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
        {"\u041e\u0442\u0432\u0435\u0442 \u043d\u0430 \u044d\u0442\u043e \u0437\u0430\u0434\u0430\u043d\u0438\u0435 \u043d\u0435 \u043e\u0446\u0435\u043d\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438"}
      </p>
    </div>
  );
}
