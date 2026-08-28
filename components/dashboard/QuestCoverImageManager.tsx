"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import {
  getImageUploadErrorMessage,
  ImageUploadStatus,
} from "@/components/media/ImageUploader";
import {
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";
import {
  removeQuestCoverImage,
  uploadQuestCoverImage,
} from "@/services/storage.service";

type QuestCoverImageManagerProps = {
  questId: string;
  initialCoverImageUrl: string | null;
};

export default function QuestCoverImageManager({
  questId,
  initialCoverImageUrl,
}: QuestCoverImageManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const [busy, setBusy] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadSucceeded, setUploadSucceeded] = useState(false);

  async function handleUpload(file: File) {
    if (busy) return;

    setBusy(true);
    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setUploadSucceeded(false);

    try {
      const result = await uploadQuestCoverImage(questId, file);

      if (result.error || !result.coverImageUrl) {
        setErrorMessage(getImageUploadErrorMessage(result.error));
        return;
      }

      setCoverImageUrl(result.coverImageUrl);
      setUploadSucceeded(true);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage(getImageUploadErrorMessage(error));
    } finally {
      setBusy(false);
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    await handleUpload(file);
  }

  async function handleRemove() {
    if (busy || !coverImageUrl) return;

    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");
    setUploadSucceeded(false);

    try {
      const result = await removeQuestCoverImage(questId);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      setCoverImageUrl(null);
      setSuccessMessage("Обложка удалена.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage("Не удалось удалить обложку.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Обложка</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Необязательное изображение 16:9 для библиотеки учителя и
            предпросмотра.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={handleFileChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            aria-label={coverImageUrl ? "Заменить обложку" : "Загрузить обложку"}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {coverImageUrl ? "Заменить обложку" : "Загрузить обложку"}
          </button>

          {coverImageUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Удалить обложку
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt="Обложка квеста"
            width={1280}
            height={720}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
            {isUploading ? <ImageUploadStatus status="uploading" /> : "Обложка не загружена"}
          </div>
        )}
        {coverImageUrl && isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[1px]">
            <ImageUploadStatus status="uploading" />
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}

      {uploadSucceeded ? (
        <div className="mt-4">
          <ImageUploadStatus status="success" />
        </div>
      ) : null}

      {successMessage ? (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </p>
      ) : null}
    </section>
  );
}
