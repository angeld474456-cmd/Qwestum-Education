import type { PublicRuntimeMultipleChoiceTask } from "@/types/public-runtime";

type PublicMultipleChoiceTaskProps = {
  task: PublicRuntimeMultipleChoiceTask;
  selectedOptionIds: string[];
  disabled: boolean;
  onToggleOption: (optionId: string) => void;
};

export default function PublicMultipleChoiceTask({ task, selectedOptionIds, disabled, onToggleOption }: PublicMultipleChoiceTaskProps) {
  return <fieldset className="space-y-3">
    <legend className="text-xl font-semibold text-white">{task.title}</legend>
    {task.description ? <p className="text-slate-300">{task.description}</p> : null}
    {task.options.map((option) => <label key={option.id} className="flex items-center gap-3 rounded-lg border border-slate-700 p-4 text-slate-100">
      <input type="checkbox" checked={selectedOptionIds.includes(option.id)} disabled={disabled} onChange={() => onToggleOption(option.id)} />
      <span>{option.text}</span>
    </label>)}
  </fieldset>;
}
