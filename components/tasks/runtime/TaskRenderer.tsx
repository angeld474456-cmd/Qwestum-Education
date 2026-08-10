import SingleChoiceTaskRenderer, {
  SingleChoiceRuntimeOption,
} from "./SingleChoiceTaskRenderer";
import TextTaskRenderer from "./TextTaskRenderer";
import MultipleChoiceTaskRenderer from "./MultipleChoiceTaskRenderer";

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
