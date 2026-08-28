"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  imageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
}

export const IMAGE_UPLOAD_FAILURE_MESSAGE =
  "Не удалось загрузить изображение. Попробуйте ещё раз.";

export function getImageUploadButtonLabel(imageUrl?: string | null) {
  return imageUrl ? "Заменить изображение" : "Загрузить изображение";
}

export function getSelectedImageFileLabel(fileName: string) {
  return `Выбрано: ${fileName}`;
}

export function imageUploaderIsBusy(disabled: boolean, isUploading: boolean) {
  return disabled || isUploading;
}

export function getImageUploadErrorMessage(error: unknown) {
  const detail =
    error instanceof Error
      ? error.message.trim()
      : typeof error === "string"
        ? error.trim()
        : "";

  if (!detail || detail === IMAGE_UPLOAD_FAILURE_MESSAGE) {
    return IMAGE_UPLOAD_FAILURE_MESSAGE;
  }

  return `${IMAGE_UPLOAD_FAILURE_MESSAGE} ${detail}`;
}

export function ImageUploadStatus({
  status,
}: {
  status: "uploading" | "success";
}) {
  if (status === "uploading") {
    return (
      <span
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-sm font-medium text-violet-100"
      >
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Загрузка изображения...
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm text-emerald-300"
    >
      <CheckCircle2 className="size-4" aria-hidden="true" />
      Изображение загружено
    </span>
  );
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSucceeded, setUploadSucceeded] = useState(false);
  const interactionDisabled = imageUploaderIsBusy(disabled, isUploading);

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file || interactionDisabled) return;

    setSelectedFileName(file.name);
    setIsUploading(true);
    setUploadError(null);
    setUploadSucceeded(false);

    try {
      await uploadSelectedTaskImage({
        disabled: false,
        file,
        onSelected: () => {},
        onUpload,
      });
      setUploadSucceeded(true);
    } catch (error) {
      setUploadError(getImageUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemove() {
    if (!onRemove || interactionDisabled) return;

    setUploadSucceeded(false);
    setUploadError(null);
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
        <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-700">
          <Image
            src={imageUrl}
            alt="Изображение задания"
            width={1200}
            height={675}
            unoptimized
            className="w-full"
          />
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[1px]">
              <ImageUploadStatus status="uploading" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-slate-600 text-slate-400">
          {isUploading ? (
            <ImageUploadStatus status="uploading" />
          ) : (
            "Изображение пока не загружено"
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={interactionDisabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={interactionDisabled}
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

        {uploadSucceeded ? <ImageUploadStatus status="success" /> : null}
      </div>

      {uploadError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {uploadError}
        </p>
      ) : null}

      {imageUrl && onRemove ? (
        <button
          type="button"
          onClick={handleRemove}
          disabled={interactionDisabled}
          className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Удалить изображение"
        >
          Удалить изображение
        </button>
      ) : null}

    </div>
  );
}
