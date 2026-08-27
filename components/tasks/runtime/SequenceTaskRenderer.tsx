"use client";

import Image from "next/image";
import { useState } from "react";

import {
  getTeacherSequencePreviewOrder,
  moveSequenceItem,
  type SequenceTaskItem,
} from "@/lib/sequence-task-content";

type SequenceTaskRendererProps = {
  taskId: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  items: SequenceTaskItem[];
  canonicalOrder: string[];
  mode: "preview" | "play";
  answer?: string[];
  onAnswerChange?: (itemIds: string[]) => void;
};

export default function SequenceTaskRenderer({
  taskId,
  items,
  canonicalOrder,
  mode,
  answer,
  ...props
}: SequenceTaskRendererProps) {
  const orderKey = [
    taskId,
    mode,
    items.map((item) => item.id).join(","),
    canonicalOrder.join(","),
    answer?.join(",") ?? "",
  ].join(":");

  return (
    <SequenceTaskRendererContent
      key={orderKey}
      taskId={taskId}
      items={items}
      canonicalOrder={canonicalOrder}
      mode={mode}
      answer={answer}
      {...props}
    />
  );
}

function SequenceTaskRendererContent({
  taskId,
  title,
  description,
  imageUrl,
  items,
  canonicalOrder,
  mode,
  answer,
  onAnswerChange,
}: SequenceTaskRendererProps) {
  const [orderedItemIds, setOrderedItemIds] = useState(() =>
    mode === "play" && answer?.length === items.length
      ? answer
      : getTeacherSequencePreviewOrder(taskId, items, canonicalOrder)
  );
  const itemById = new Map(items.map((item) => [item.id, item]));
  const orderedItems = orderedItemIds
    .map((itemId) => itemById.get(itemId))
    .filter((item): item is SequenceTaskItem => Boolean(item));

  function moveItem(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= orderedItemIds.length) return;

    const nextOrder = moveSequenceItem(
      orderedItemIds.map((id) => ({ id, text: "" })),
      index,
      direction
    ).map((item) => item.id);
    setOrderedItemIds(nextOrder);
    onAnswerChange?.(nextOrder);
  }

  return (
    <article className="rounded-2xl bg-[#111827] p-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      {description ? <p className="mt-3 text-slate-300">{description}</p> : null}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${title || "Task"} image`}
          width={1200}
          height={675}
          unoptimized
          className="mt-5 max-h-80 w-full rounded-xl object-cover"
        />
      ) : null}

      <ol className="mt-6 space-y-3" aria-label="Порядок элементов">
        {orderedItems.map((item, index) => (
          <li
            key={item.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-700 bg-[#1B2435] p-4"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-200">
              {index + 1}
            </span>
            <span className="min-w-0 break-words text-slate-100">{item.text}</span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                aria-label={`Переместить элемент ${index + 1} вверх`}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Вверх
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === orderedItems.length - 1}
                aria-label={`Переместить элемент ${index + 1} вниз`}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Вниз
              </button>
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
