import SingleChoiceTaskRenderer, {
  SingleChoiceRuntimeOption,
} from "./SingleChoiceTaskRenderer";
import TextTaskRenderer from "./TextTaskRenderer";

export interface TaskRendererProps {
  mode?: "preview" | "play";
  taskType: string;
  title: string;
  description: string;
  options?: SingleChoiceRuntimeOption[];
  correctOptionId?: string;
  onTextAnswerChange?: (answer: string) => void;
  onSingleChoiceAnswerChange?: (optionId: string) => void;
}

export default function TaskRenderer({
  mode = "preview",
  taskType,
  title,
  description,
  options = [],
  correctOptionId = "",
  onTextAnswerChange,
  onSingleChoiceAnswerChange,
}: TaskRendererProps) {
  if (taskType === "single_choice") {
    return (
      <SingleChoiceTaskRenderer
        title={title}
        description={description}
        options={options}
        correctOptionId={correctOptionId}
        mode={mode}
        onAnswerChange={onSingleChoiceAnswerChange}
      />
    );
  }

  return (
    <TextTaskRenderer
      title={title}
      description={description}
      mode={mode}
      onAnswerChange={onTextAnswerChange}
    />
  );
}
