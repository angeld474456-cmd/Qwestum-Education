import type { PublicRuntimeTask } from "@/types/public-runtime";

import PublicSingleChoiceTask from "./PublicSingleChoiceTask";
import PublicTextTask from "./PublicTextTask";
import PublicMultipleChoiceTask from "./PublicMultipleChoiceTask";

type PublicTaskRendererProps = {
  task: PublicRuntimeTask;
  selectedOptionId?: string;
  disabled: boolean;
  onSelectOption: (optionId: string) => void;
  selectedOptionIds?: string[];
  onToggleOption: (optionId: string) => void;
};

export default function PublicTaskRenderer({
  task,
  selectedOptionId,
  disabled,
  onSelectOption,
  selectedOptionIds = [],
  onToggleOption,
}: PublicTaskRendererProps) {
  if (task.taskType === "text") {
    return <PublicTextTask task={task} />;
  }

  if (task.taskType === "single_choice") {
    return (
      <PublicSingleChoiceTask
        task={task}
        selectedOptionId={selectedOptionId}
        disabled={disabled}
        onSelectOption={onSelectOption}
      />
    );
  }

  if (task.taskType === "multiple_choice") {
    return <PublicMultipleChoiceTask task={task} selectedOptionIds={selectedOptionIds} disabled={disabled} onToggleOption={onToggleOption} />;
  }

  return null;
}
