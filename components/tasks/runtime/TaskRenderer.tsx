import SingleChoiceTaskRenderer, {
  SingleChoiceRuntimeOption,
} from "./SingleChoiceTaskRenderer";
import TextTaskRenderer from "./TextTaskRenderer";

export interface TaskRendererProps {
  taskType: string;
  title: string;
  description: string;
  options?: SingleChoiceRuntimeOption[];
  correctOptionId?: string;
}

export default function TaskRenderer({
  taskType,
  title,
  description,
  options = [],
  correctOptionId = "",
}: TaskRendererProps) {
  if (taskType === "single_choice") {
    return (
      <SingleChoiceTaskRenderer
        title={title}
        description={description}
        options={options}
        correctOptionId={correctOptionId}
      />
    );
  }

  return (
    <TextTaskRenderer
      title={title}
      description={description}
    />
  );
}
