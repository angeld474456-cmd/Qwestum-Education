"use client";

import { useState } from "react";
import ImageUploader from "@/components/media/ImageUploader";
import { parsePositiveSafeInteger } from "@/lib/task-points";
import { parseMultipleChoiceContent, type ChoiceOption } from "@/lib/multiple-choice";
import type { TextTaskEditorProps } from "./TextTaskEditor";

function autoSizeOptionTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export default function MultipleChoiceTaskEditor({ task, onSave, onUploadImage, onRemoveImage }: TextTaskEditorProps) {
  const initial = parseMultipleChoiceContent(task.content) ?? { options: [], correctOptionIds: [] };
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [points, setPoints] = useState(String(task.points));
  const [options, setOptions] = useState<ChoiceOption[]>(initial.options);
  const [correctOptionIds, setCorrectOptionIds] = useState(initial.correctOptionIds);
  const parsedPoints = parsePositiveSafeInteger(points);
  const content = parseMultipleChoiceContent({ options, correctOptionIds });
  const valid = Boolean(title.trim() && parsedPoints !== null && content);

  function addOption() { setOptions((current) => [...current, { id: crypto.randomUUID(), text: "" }]); }
  function removeOption(id: string) { setOptions((current) => current.filter((option) => option.id !== id)); setCorrectOptionIds((current) => current.filter((optionId) => optionId !== id)); }
  function toggleCorrect(id: string) { setCorrectOptionIds((current) => current.includes(id) ? current.filter((optionId) => optionId !== id) : [...current, id]); }

  return <div className="mt-8 space-y-6">
    <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl bg-[#1B2435] p-4" aria-label="Название задания" />
    <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} className="w-full rounded-xl bg-[#1B2435] p-4" aria-label="Описание задания" />
    <div className="space-y-3">{options.map((option) => <div key={option.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3"><input type="checkbox" checked={correctOptionIds.includes(option.id)} onChange={() => toggleCorrect(option.id)} aria-label="Правильный ответ" /><textarea rows={3} value={option.text} ref={autoSizeOptionTextarea} onInput={(event) => autoSizeOptionTextarea(event.currentTarget)} onChange={(event) => setOptions((current) => current.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item))} className="min-h-24 w-full resize-y overflow-x-hidden break-words rounded-xl bg-[#1B2435] p-4" aria-label="Вариант ответа" /><button type="button" onClick={() => removeOption(option.id)} className="self-start rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]">Удалить</button></div>)}</div>
    <button type="button" onClick={addOption} className="mt-1 inline-flex min-h-11 items-center rounded-xl border border-slate-500/70 bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]">Добавить вариант</button>
    <input type="number" min={1} step={1} value={points} onChange={(event) => setPoints(event.target.value)} className="w-full rounded-xl bg-[#1B2435] p-4" aria-label="Баллы" />
    <ImageUploader imageUrl={task.image_url} onUpload={(file) => onUploadImage(task.id, file)} onRemove={() => onRemoveImage(task.id)} />
    <button type="button" disabled={!valid} onClick={() => { if (content && parsedPoints !== null) onSave(task.id, title, description, parsedPoints, content); }} className="inline-flex min-h-12 items-center rounded-xl bg-violet-600 px-8 py-4 font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-50">Сохранить</button>
  </div>;
}
