interface TextTaskPreviewProps {
  title: string;
  description: string;
}

export default function TextTaskPreview({
  title,
  description,
}: TextTaskPreviewProps) {
  return (
    <div className="rounded-2xl bg-[#1B2435] p-6">
      <h3 className="text-2xl font-bold">
        {title || "Название задания"}
      </h3>

      <p className="mt-3 text-slate-300">
        {description || "Описание задания"}
      </p>
    </div>
  );
}
