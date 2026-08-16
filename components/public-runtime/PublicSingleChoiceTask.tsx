import type { PublicRuntimeSingleChoiceTask } from "@/types/public-runtime";

import PublicTaskImage from "./PublicTaskImage";

type PublicSingleChoiceTaskProps = {
  task: PublicRuntimeSingleChoiceTask;
  selectedOptionId?: string;
  disabled: boolean;
  onSelectOption: (optionId: string) => void;
};

export default function PublicSingleChoiceTask({
  task,
  selectedOptionId,
  disabled,
  onSelectOption,
}: PublicSingleChoiceTaskProps) {
  const inputName = `public-runtime-task-${task.id}`;

  return (
    <fieldset className="space-y-5" disabled={disabled}>
      <legend className="text-2xl font-bold text-white">{task.title}</legend>
      {task.description ? (
        <p className="whitespace-pre-wrap leading-7 text-slate-300">
          {task.description}
        </p>
      ) : null}
      <PublicTaskImage imageUrl={task.imageUrl} title={task.title} />
      <div className="space-y-3">
        {task.options.map((option, index) => {
          const inputId = `public-runtime-${task.id}-option-${index}`;

          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-700 bg-slate-900 p-4 text-slate-100 transition has-[:checked]:border-violet-500 has-[:checked]:bg-violet-500/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <input
                id={inputId}
                name={inputName}
                type="radio"
                value={option.id}
                checked={selectedOptionId === option.id}
                disabled={disabled}
                onChange={() => onSelectOption(option.id)}
                className="mt-1 size-4 border-slate-600 bg-slate-950 text-violet-500 focus:ring-violet-500"
              />
              <span className="min-w-0 flex-1 whitespace-normal break-words leading-6 [overflow-wrap:anywhere]">{option.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
