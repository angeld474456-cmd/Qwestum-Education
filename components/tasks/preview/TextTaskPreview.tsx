import TextTaskRenderer from "@/components/tasks/runtime/TextTaskRenderer";

interface TextTaskPreviewProps {
  title: string;
  description: string;
}

export default function TextTaskPreview({
  title,
  description,
}: TextTaskPreviewProps) {
  return (
    <TextTaskRenderer
      title={title}
      description={description}
    />
  );
}
