"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import Card from "@/components/ui/Card";
import { getQuest, Quest, updateQuest } from "@/services/quest.service";

export default function TeacherQuestSettingsPage() {
  const params = useParams();
  const id = params.id as string;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadQuest() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data, error } = await getQuest(id);

      if (error || !data) {
        console.error(error);
        setErrorMessage("Unable to load quest settings.");
        setLoading(false);
        return;
      }

      setQuest(data);
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setDifficulty(Number(data.difficulty) || 1);
      setIsPublic(Boolean(data.is_public));
      setLoading(false);
    }

    loadQuest();
  }, [id]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    const { error } = await updateQuest(id, {
      title: normalizedTitle,
      description,
      difficulty: normalizedDifficulty,
      is_public: isPublic,
    });

    if (error) {
      console.error(error);
      setErrorMessage("Unable to save quest settings.");
      setSaving(false);
      return;
    }

    setQuest((currentQuest) =>
      currentQuest
        ? {
            ...currentQuest,
            title: normalizedTitle,
            description,
            difficulty: normalizedDifficulty,
            is_public: isPublic,
          }
        : currentQuest
    );
    setSuccessMessage("Quest settings saved.");
    setSaving(false);
  }

  if (loading) {
    return (
      <section className="space-y-6 text-white">
        <Card>
          <p className="text-slate-300">Loading quest settings...</p>
        </Card>
      </section>
    );
  }

  if (!quest) {
    return (
      <section className="space-y-6 text-white">
        <Card>
          <h1 className="text-3xl font-bold">Quest settings unavailable</h1>
          <p className="mt-3 text-slate-400">
            The selected quest could not be loaded.
          </p>
          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          ) : null}
          <Link
            href="/dashboard/quests"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Back to library
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Quest Settings
          </p>
          <h1 className="mt-2 text-4xl font-bold">{quest.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Edit basic quest metadata and control whether this quest is public
            or saved as a draft.
          </p>
        </div>

        <QuestWorkspaceNav questId={id} active="settings" />
      </div>

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
    </section>
  );
}
