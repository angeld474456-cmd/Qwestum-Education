import SingleChoiceTaskRenderer, {
  SingleChoiceRuntimeOption,
} from "@/components/tasks/runtime/SingleChoiceTaskRenderer";

export type SingleChoicePreviewOption = SingleChoiceRuntimeOption;

interface SingleChoiceTaskPreviewProps {
  title: string;
  description: string;
  options: SingleChoicePreviewOption[];
  correctOptionId: string;
}

export default function SingleChoiceTaskPreview({
  title,
  description,
  options,
  correctOptionId,
}: SingleChoiceTaskPreviewProps) {
  return (
    <SingleChoiceTaskRenderer
      title={title}
      description={description}
      options={options}
      correctOptionId={correctOptionId}
    />
  );
}
