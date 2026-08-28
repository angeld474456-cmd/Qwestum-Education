"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";

import type { PublicRuntimeSequenceTask } from "@/types/public-runtime";

export function movePublicSequenceItem(
  itemIds: string[],
  index: number,
  direction: -1 | 1
) {
  const destination = index + direction;

  if (destination < 0 || destination >= itemIds.length) return itemIds;

  const nextItemIds = [...itemIds];
  [nextItemIds[index], nextItemIds[destination]] = [
    nextItemIds[destination],
    nextItemIds[index],
  ];
  return nextItemIds;
}

type PublicSequenceTaskProps = {
  task: PublicRuntimeSequenceTask;
  orderedItemIds?: string[];
  disabled: boolean;
  onChange: (itemIds: string[]) => void;
};

export default function PublicSequenceTask({
  task,
  orderedItemIds,
  disabled,
  onChange,
}: PublicSequenceTaskProps) {
  const initialItemIds = task.items.map((item) => item.id);
  const visibleItemIds = orderedItemIds ?? initialItemIds;
  const itemById = new Map(task.items.map((item) => [item.id, item]));
  const visibleItems = visibleItemIds
    .map((itemId) => itemById.get(itemId))
    .filter((item): item is PublicRuntimeSequenceTask["items"][number] => Boolean(item));

  if (visibleItems.length !== task.items.length) return null;

  function moveItem(index: number, direction: -1 | 1) {
    if (disabled) return;

    onChange(movePublicSequenceItem(visibleItemIds, index, direction));
  }

  return (
    <article>
      <h2 className="text-2xl font-bold text-white">{task.title}</h2>
      {task.description ? (
        <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-300">
          {task.description}
        </p>
      ) : null}
      {task.imageUrl ? (
        <Image
          src={task.imageUrl}
          alt={`${task.title} image`}
          width={1200}
          height={675}
          unoptimized
          className="mt-5 max-h-80 w-full rounded-xl object-cover"
        />
      ) : null}

      <ol className="mt-6 space-y-3" aria-label="Порядок элементов">
        {visibleItems.map((item, index) => (
          <li
            key={item.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-100">
              {index + 1}
            </span>
            <span className="min-w-0 break-words text-slate-100">{item.text}</span>
            <span className="col-start-2 flex justify-end gap-2 sm:col-auto">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={disabled || index === 0}
                aria-label={`Переместить элемент ${index + 1} вверх`}
                title="Переместить вверх"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-100 transition hover:border-indigo-400 hover:bg-indigo-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={disabled || index === visibleItems.length - 1}
                aria-label={`Переместить элемент ${index + 1} вниз`}
                title="Переместить вниз"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-100 transition hover:border-indigo-400 hover:bg-indigo-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
