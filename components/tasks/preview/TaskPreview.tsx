import TaskRenderer from "@/components/tasks/runtime/TaskRenderer";
import { SingleChoiceRuntimeOption } from "@/components/tasks/runtime/SingleChoiceTaskRenderer";

interface TaskPreviewProps {
  taskType: string;
  title: string;
  description: string;
  options?: SingleChoiceRuntimeOption[];
  correctOptionId?: string;
}

export default function TaskPreview({
  taskType,
  title,
  description,
  options = [],
  correctOptionId = "",
}: TaskPreviewProps) {
  return (
    <TaskRenderer
      mode="preview"
      taskType={taskType}
      title={title}
      description={description}
      options={options}
      correctOptionId={correctOptionId}
    />
  );
}
