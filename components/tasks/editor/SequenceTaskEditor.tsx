"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import ImageUploader from "@/components/media/ImageUploader";
import TaskPreview from "@/components/tasks/preview/TaskPreview";
import {
  getSequenceValidationMessages,
  moveSequenceItem,
  parseSequenceTaskContent,
  SEQUENCE_MAX_ITEMS,
  SEQUENCE_MIN_ITEMS,
  serializeSequenceTaskContent,
  type SequenceTaskItem,
} from "@/lib/sequence-task-content";
import { parsePositiveSafeInteger, POINTS_VALIDATION_MESSAGE } from "@/lib/task-points";

import { getTaskTypeLabel, type TextTaskEditorProps } from "./TextTaskEditor";

function createItem(): SequenceTaskItem {
  return { id: crypto.randomUUID(), text: "" };
}

function createMinimumItems() {
  return Array.from({ length: SEQUENCE_MIN_ITEMS }, createItem);
}

export default function SequenceTaskEditor({
  task,
  onSave,
  onUploadImage,
  onRemoveImage,
}: TextTaskEditorProps) {
  const parsedContent = task.content === null ? null : parseSequenceTaskContent(task.content);
  const isMalformed = task.content !== null && parsedContent === null;
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [points, setPoints] = useState(String(task.points));
  const [items, setItems] = useState<SequenceTaskItem[]>(() =>
    parsedContent?.items ?? (task.content === null ? createMinimumItems() : [])
  );
  const parsedPoints = parsePositiveSafeInteger(points);
  const validationMessages = isMalformed
    ? ["Содержимое последовательности повреждено. Сохранение заблокировано."]
    : [
        !title.trim() ? "Введите название задания." : null,
        !description.trim() ? "Введите текст задания." : null,
        parsedPoints === null ? POINTS_VALIDATION_MESSAGE : null,
        ...getSequenceValidationMessages(items),
      ].filter((message): message is string => Boolean(message));
  const content = isMalformed ? null : serializeSequenceTaskContent(items);
  const canSave = validationMessages.length === 0 && parsedPoints !== null && content !== null;

  function moveItem(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return;

    setItems((current) => moveSequenceItem(current, index, direction));
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label htmlFor="sequence-task-title" className="mb-2 block text-slate-300">Название</label>
        <input id="sequence-task-title" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl bg-[#1B2435] p-4" />
      </div>
      <div>
        <label htmlFor="sequence-task-description" className="mb-2 block text-slate-300">Текст задания</label>
        <textarea id="sequence-task-description" rows={6} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl bg-[#1B2435] p-4" />
      </div>
      <section aria-labelledby="sequence-items-heading">
        <h3 id="sequence-items-heading" className="text-lg font-semibold">Правильная последовательность</h3>
        <p className="mt-1 text-sm text-slate-400">Расположите элементы в каноническом правильном порядке.</p>
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/45 p-3 transition hover:border-indigo-400/40 hover:bg-indigo-950/20 focus-within:border-indigo-400/55 focus-within:bg-indigo-950/25 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-indigo-300/20 bg-indigo-500/20 text-sm font-bold text-indigo-100">{index + 1}</span>
              <textarea rows={2} value={item.text} maxLength={1001} onChange={(event) => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, text: event.target.value } : currentItem))} className="min-h-20 w-full resize-y rounded-lg border border-slate-700 bg-[#141d2d] px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" aria-label={`Текст элемента ${index + 1}`} />
              <div className="col-start-2 flex flex-wrap justify-end gap-2 md:col-auto md:flex-nowrap">
                <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label={`Переместить элемент ${index + 1} вверх`} title="Переместить вверх" className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-35"><ArrowUp className="size-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label={`Переместить элемент ${index + 1} вниз`} title="Переместить вниз" className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-35"><ArrowDown className="size-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))} disabled={items.length <= SEQUENCE_MIN_ITEMS} aria-label={`Удалить элемент ${index + 1}`} title="Удалить элемент" className="inline-flex size-10 items-center justify-center rounded-lg border border-red-400/25 bg-red-500/10 text-red-200 transition hover:border-red-400/55 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="size-4" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setItems((current) => [...current, createItem()])} disabled={items.length >= SEQUENCE_MAX_ITEMS || isMalformed} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-500/70 bg-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-40"><Plus className="size-4" aria-hidden="true" />Добавить элемент</button>
      </section>
      <div className="grid grid-cols-2 gap-4">
        <div><label htmlFor="sequence-task-type" className="mb-2 block text-slate-300">Тип задания</label><input id="sequence-task-type" value={getTaskTypeLabel(task.task_type)} readOnly className="w-full rounded-xl bg-[#1B2435] p-4" /></div>
        <div><label htmlFor="sequence-task-points" className="mb-2 block text-slate-300">Баллы</label><input id="sequence-task-points" type="number" min={1} step={1} value={points} onChange={(event) => setPoints(event.target.value)} className="w-full rounded-xl bg-[#1B2435] p-4" aria-invalid={parsedPoints === null || undefined} /></div>
      </div>
      <ImageUploader imageUrl={task.image_url} onUpload={(file) => onUploadImage(task.id, file)} onRemove={() => onRemoveImage(task.id)} />
      {!isMalformed && content ? <TaskPreview taskType="sequence" title={title} description={description} sequenceItems={content.items} sequenceCorrectOrder={content.correctOrder} taskId={task.id} /> : null}
      {validationMessages.length > 0 ? <div role="alert" className="rounded-xl bg-red-950/40 p-4 text-sm text-red-200">{validationMessages.map((message) => <p key={message}>{message}</p>)}</div> : null}
      <button type="button" disabled={!canSave} onClick={() => { if (parsedPoints !== null && content) onSave(task.id, title, description, parsedPoints, content); }} className="rounded-xl bg-violet-600 px-8 py-4 font-semibold disabled:opacity-50">Сохранить</button>
    </div>
  );
}
