"use client";

import { useState } from "react";
import ImageUploader from "@/components/media/ImageUploader";
import { parsePositiveSafeInteger } from "@/lib/task-points";
import { parseMultipleChoiceContent, type ChoiceOption } from "@/lib/multiple-choice";
import type { TextTaskEditorProps } from "./TextTaskEditor";

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
    <div className="space-y-3">{options.map((option) => <div key={option.id} className="grid grid-cols-[auto_1fr_auto] gap-3"><input type="checkbox" checked={correctOptionIds.includes(option.id)} onChange={() => toggleCorrect(option.id)} aria-label="Правильный ответ" /><input value={option.text} onChange={(event) => setOptions((current) => current.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item))} className="rounded-xl bg-[#1B2435] p-4" aria-label="Вариант ответа" /><button type="button" onClick={() => removeOption(option.id)}>Удалить</button></div>)}</div>
    <button type="button" onClick={addOption}>Добавить вариант</button>
    <input type="number" min={1} step={1} value={points} onChange={(event) => setPoints(event.target.value)} className="w-full rounded-xl bg-[#1B2435] p-4" aria-label="Баллы" />
    <ImageUploader imageUrl={task.image_url} onUpload={(file) => onUploadImage(task.id, file)} onRemove={() => onRemoveImage(task.id)} />
    <button type="button" disabled={!valid} onClick={() => { if (content && parsedPoints !== null) onSave(task.id, title, description, parsedPoints, content); }}>Сохранить</button>
  </div>;
}
