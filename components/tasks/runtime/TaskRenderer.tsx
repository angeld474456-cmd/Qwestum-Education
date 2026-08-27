import SingleChoiceTaskRenderer, {
  SingleChoiceRuntimeOption,
} from "./SingleChoiceTaskRenderer";
import TextTaskRenderer from "./TextTaskRenderer";
import MultipleChoiceTaskRenderer from "./MultipleChoiceTaskRenderer";
import SequenceTaskRenderer from "./SequenceTaskRenderer";
import type { SequenceTaskItem } from "@/lib/sequence-task-content";

export interface TaskRendererProps {
  mode?: "preview" | "play";
  taskType: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  options?: SingleChoiceRuntimeOption[];
  correctOptionId?: string;
  answer?: string;
  onTextAnswerChange?: (answer: string) => void;
  onSingleChoiceAnswerChange?: (optionId: string) => void;
  multipleChoiceAnswer?: string[];
  correctOptionIds?: string[];
  onMultipleChoiceAnswerChange?: (optionIds: string[]) => void;
  taskId?: string;
  sequenceItems?: SequenceTaskItem[];
  sequenceCorrectOrder?: string[];
  sequenceAnswer?: string[];
  onSequenceAnswerChange?: (itemIds: string[]) => void;
}

export default function TaskRenderer({
  mode = "preview",
  taskType,
  title,
  description,
  imageUrl,
  options = [],
  correctOptionId = "",
  answer = "",
  onTextAnswerChange,
  onSingleChoiceAnswerChange,
  multipleChoiceAnswer = [],
  correctOptionIds = [],
  onMultipleChoiceAnswerChange,
  taskId = "preview-task",
  sequenceItems = [],
  sequenceCorrectOrder = [],
  sequenceAnswer = [],
  onSequenceAnswerChange,
}: TaskRendererProps) {
  if (taskType === "single_choice") {
    return (
      <SingleChoiceTaskRenderer
        title={title}
        description={description}
        imageUrl={imageUrl}
        options={options}
        correctOptionId={correctOptionId}
        mode={mode}
        answer={answer}
        onAnswerChange={onSingleChoiceAnswerChange}
      />
    );
  }

  if (taskType === "multiple_choice") {
    return <MultipleChoiceTaskRenderer title={title} description={description} imageUrl={imageUrl} options={options} correctOptionIds={correctOptionIds} mode={mode} answer={multipleChoiceAnswer} onAnswerChange={onMultipleChoiceAnswerChange} />;
  }

  if (taskType === "sequence") {
    if (sequenceItems.length === 0 || sequenceCorrectOrder.length === 0) {
      return (
        <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-red-200">
          Последовательность задания повреждена.
        </div>
      );
    }

    return (
      <SequenceTaskRenderer
        taskId={taskId}
        title={title}
        description={description}
        imageUrl={imageUrl}
        items={sequenceItems}
        canonicalOrder={sequenceCorrectOrder}
        mode={mode}
        answer={sequenceAnswer}
        onAnswerChange={onSequenceAnswerChange}
      />
    );
  }

  if (taskType !== "text") {
    return (
      <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-red-200">
        Неподдерживаемый тип задания.
      </div>
    );
  }

  return (
    <TextTaskRenderer
      title={title}
      description={description}
      imageUrl={imageUrl}
      mode={mode}
      answer={answer}
      onAnswerChange={onTextAnswerChange}
    />
  );
}
