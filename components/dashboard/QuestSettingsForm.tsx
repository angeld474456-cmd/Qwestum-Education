"use client";

import { FormEvent, useState } from "react";

import Card from "@/components/ui/Card";

type QuestSettingsFormProps = {
  quest: {
    id: string;
    title: string;
    description: string | null;
    difficulty: number;
    is_public: boolean;
  };
};

type QuestSettingsResponse = {
  quest?: {
    id: string;
    title: string;
    description: string | null;
    difficulty: number;
    is_public: boolean;
  };
  error?: string;
};

export default function QuestSettingsForm({
  quest,
}: QuestSettingsFormProps) {
  const [title, setTitle] = useState(quest.title ?? "");
  const [description, setDescription] = useState(quest.description ?? "");
  const [difficulty, setDifficulty] = useState(Number(quest.difficulty) || 1);
  const [isPublic, setIsPublic] = useState(Boolean(quest.is_public));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const normalizedTitle = title.trim();
    const normalizedDifficulty = Number(difficulty);

    setErrorMessage("");
    setSuccessMessage("");

    if (!normalizedTitle) {
      setErrorMessage("Title is required.");
      return;
    }

    if (Number.isNaN(normalizedDifficulty)) {
      setErrorMessage("Difficulty must be a number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/teacher/quests/${quest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: normalizedTitle,
          description,
          difficulty: normalizedDifficulty,
          is_public: isPublic,
        }),
      });

      const result = (await response.json()) as QuestSettingsResponse;

      if (!response.ok || !result.quest) {
        setErrorMessage(result.error ?? "Unable to save quest settings.");
        return;
      }

      setTitle(result.quest.title ?? "");
      setDescription(result.quest.description ?? "");
      setDifficulty(Number(result.quest.difficulty) || 1);
      setIsPublic(Boolean(result.quest.is_public));
      setSuccessMessage("Quest settings saved.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to save quest settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label
            htmlFor="quest-title"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Title
          </label>
          <input
            id="quest-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="quest-description"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Description
          </label>
          <textarea
            id="quest-description"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="quest-difficulty"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Difficulty
          </label>
          <select
            id="quest-difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#1B2435] p-4">
          <span>
            <span className="block font-semibold">Publication state</span>
            <span className="mt-1 block text-sm text-slate-400">
              {isPublic ? "Public" : "Draft"}
            </span>
          </span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="h-5 w-5"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-violet-600 px-8 py-4 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </Card>
  );
}
