"use client";

import Image from "next/image";

interface ImageUploaderProps {
  imageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
}

export default function ImageUploader({
  imageUrl,
  onUpload,
  onRemove,
  disabled = false,
}: ImageUploaderProps) {
  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (disabled) return;

    await onUpload(file);
    e.target.value = "";
  }

  return (
    <div className="rounded-2xl bg-[#111827] p-6">

      <h3 className="text-xl font-bold">
        Изображение задания
      </h3>

      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Изображение задания"
          width={1200}
          height={675}
          unoptimized
          className="mt-4 w-full rounded-xl border border-slate-700"
        />
      ) : (
        <div className="mt-4 flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-slate-600 text-slate-400">
          Изображение пока не загружено
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="mt-6 block w-full text-sm"
        aria-label="Загрузить изображение задания"
      />

      {imageUrl && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Удалить изображение"
        >
          Удалить изображение
        </button>
      ) : null}

    </div>
  );
}
