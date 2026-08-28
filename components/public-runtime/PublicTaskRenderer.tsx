import type { PublicRuntimeTask } from "@/types/public-runtime";

import PublicSingleChoiceTask from "./PublicSingleChoiceTask";
import PublicTextTask from "./PublicTextTask";
import PublicMultipleChoiceTask from "./PublicMultipleChoiceTask";
import PublicSequenceTask from "./PublicSequenceTask";

type PublicTaskRendererProps = {
  task: PublicRuntimeTask;
  selectedOptionId?: string;
  disabled: boolean;
  onSelectOption: (optionId: string) => void;
  selectedOptionIds?: string[];
  onToggleOption: (optionId: string) => void;
  orderedItemIds?: string[];
  onSequenceChange: (itemIds: string[]) => void;
};

export default function PublicTaskRenderer({
  task,
  selectedOptionId,
  disabled,
  onSelectOption,
  selectedOptionIds = [],
  onToggleOption,
  orderedItemIds,
  onSequenceChange,
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

  if (task.taskType === "sequence") {
    return (
      <PublicSequenceTask
        task={task}
        orderedItemIds={orderedItemIds}
        disabled={disabled}
        onChange={onSequenceChange}
      />
    );
  }

  return <div role="alert">Неподдерживаемый тип задания.</div>;
}
