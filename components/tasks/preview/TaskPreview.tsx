import TaskRenderer from "@/components/tasks/runtime/TaskRenderer";
import { SingleChoiceRuntimeOption } from "@/components/tasks/runtime/SingleChoiceTaskRenderer";
import type { SequenceTaskItem } from "@/lib/sequence-task-content";

interface TaskPreviewProps {
  taskType: string;
  title: string;
  description: string;
  options?: SingleChoiceRuntimeOption[];
  correctOptionId?: string;
  taskId?: string;
  sequenceItems?: SequenceTaskItem[];
  sequenceCorrectOrder?: string[];
}

export default function TaskPreview({
  taskType,
  title,
  description,
  options = [],
  correctOptionId = "",
  taskId = "preview-task",
  sequenceItems = [],
  sequenceCorrectOrder = [],
}: TaskPreviewProps) {
  return (
    <TaskRenderer
      mode="preview"
      taskType={taskType}
      title={title}
      description={description}
      options={options}
      correctOptionId={correctOptionId}
      taskId={taskId}
      sequenceItems={sequenceItems}
      sequenceCorrectOrder={sequenceCorrectOrder}
    />
  );
}
