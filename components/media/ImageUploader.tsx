"use client";

import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploaderProps {
  imageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
}

export function getImageUploadButtonLabel(imageUrl?: string | null) {
  return imageUrl ? "Заменить изображение" : "Загрузить изображение";
}

export function getSelectedImageFileLabel(fileName: string) {
  return `Выбрано: ${fileName}`;
}

export async function uploadSelectedTaskImage({
  disabled,
  file,
  onSelected,
  onUpload,
}: {
  disabled: boolean;
  file: File | undefined;
  onSelected: (fileName: string) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  if (!file || disabled) return;

  onSelected(file.name);
  await onUpload(file);
}

export async function removeSelectedTaskImage({
  onRemoved,
  onRemove,
}: {
  onRemoved: () => void;
  onRemove: () => Promise<void>;
}) {
  await onRemove();
  onRemoved();
}

export default function ImageUploader({
  imageUrl,
  onUpload,
  onRemove,
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    await uploadSelectedTaskImage({
      disabled,
      file,
      onSelected: setSelectedFileName,
      onUpload,
    });

    if (!file || disabled) return;

    e.target.value = "";
  }

  async function handleRemove() {
    if (!onRemove) return;

    await removeSelectedTaskImage({
      onRemove,
      onRemoved: () => setSelectedFileName(null),
    });
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
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={getImageUploadButtonLabel(imageUrl)}
        >
          {getImageUploadButtonLabel(imageUrl)}
        </button>

        {selectedFileName ? (
          <p className="text-sm text-slate-300" aria-live="polite">
            {getSelectedImageFileLabel(selectedFileName)}
          </p>
        ) : null}
      </div>

      {imageUrl && onRemove ? (
        <button
          type="button"
          onClick={handleRemove}
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
