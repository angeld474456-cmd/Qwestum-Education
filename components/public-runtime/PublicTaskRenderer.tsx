import type { PublicRuntimeTask } from "@/types/public-runtime";

import PublicSingleChoiceTask from "./PublicSingleChoiceTask";
import PublicTextTask from "./PublicTextTask";

type PublicTaskRendererProps = {
  task: PublicRuntimeTask;
  selectedOptionId?: string;
  disabled: boolean;
  onSelectOption: (optionId: string) => void;
};

export default function PublicTaskRenderer({
  task,
  selectedOptionId,
  disabled,
  onSelectOption,
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

  return null;
}
