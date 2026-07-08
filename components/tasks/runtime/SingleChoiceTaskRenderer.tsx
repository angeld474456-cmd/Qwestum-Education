export interface SingleChoiceRuntimeOption {
  id: string;
  text: string;
}

export interface SingleChoiceTaskRendererProps {
  title: string;
  description: string;
  options: SingleChoiceRuntimeOption[];
  correctOptionId: string;
}

export default function SingleChoiceTaskRenderer({
  title,
  description,
  options,
  correctOptionId,
}: SingleChoiceTaskRendererProps) {
  return (
    <div className="rounded-2xl bg-[#1B2435] p-6">
      <h3 className="text-2xl font-bold">
        {title || "Название задания"}
      </h3>

      <p className="mt-3 text-slate-300">
        {description || "Описание задания"}
      </p>

      <div className="mt-5 space-y-3">
        {options.length > 0 ? (
          options.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-3 rounded-xl bg-[#111827] p-4"
            >
              <input
                type="radio"
                checked={correctOptionId === option.id}
                readOnly
              />

              <span>
                {option.text || "Вариант ответа"}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-600 p-4 text-slate-400">
            Варианты ответа пока не добавлены
          </div>
        )}
      </div>
    </div>
  );
}
