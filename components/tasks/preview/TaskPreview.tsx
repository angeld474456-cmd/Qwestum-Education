import SingleChoiceTaskPreview, {
  SingleChoicePreviewOption,
} from "./SingleChoiceTaskPreview";
import TextTaskPreview from "./TextTaskPreview";

interface TaskPreviewProps {
  taskType: string;
  title: string;
  description: string;
  options?: SingleChoicePreviewOption[];
  correctOptionId?: string;
}

export default function TaskPreview({
  taskType,
  title,
  description,
  options = [],
  correctOptionId = "",
}: TaskPreviewProps) {
  if (taskType === "single_choice") {
    return (
      <SingleChoiceTaskPreview
        title={title}
        description={description}
        options={options}
        correctOptionId={correctOptionId}
      />
    );
  }

  return (
    <TextTaskPreview
      title={title}
      description={description}
    />
  );
}
