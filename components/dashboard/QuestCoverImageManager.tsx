"use client";

import { useRef, useState } from "react";
import Image from "next/image";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleUpload(file: File) {
    if (busy) return;

    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await uploadQuestCoverImage(questId, file);

      if (result.error || !result.coverImageUrl) {
        setErrorMessage(result.error ?? "Unable to upload cover image.");
        return;
      }

      setCoverImageUrl(result.coverImageUrl);
      setSuccessMessage("Cover image saved.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage("Unable to upload cover image.");
    } finally {
      setBusy(false);

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

    try {
      const result = await removeQuestCoverImage(questId);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      setCoverImageUrl(null);
      setSuccessMessage("Cover image removed.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage("Unable to remove cover image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cover image</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Optional 16:9 image shown in the teacher library and preview.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label
            className={`inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 ${
              busy ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
          >
            {coverImageUrl ? "Replace cover" : "Upload cover"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {coverImageUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove cover
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt="Quest cover image"
            width={1280}
            height={720}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
            No cover image
          </div>
        )}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </p>
      ) : null}
    </section>
  );
}
