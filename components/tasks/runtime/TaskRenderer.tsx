import SingleChoiceTaskRenderer, {
  SingleChoiceRuntimeOption,
} from "./SingleChoiceTaskRenderer";
import TextTaskRenderer from "./TextTaskRenderer";

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
