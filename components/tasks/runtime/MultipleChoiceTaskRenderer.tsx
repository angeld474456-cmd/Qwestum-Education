"use client";

import Image from "next/image";
import type { SingleChoiceRuntimeOption } from "./SingleChoiceTaskRenderer";

interface MultipleChoiceTaskRendererProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  options: SingleChoiceRuntimeOption[];
  correctOptionIds?: string[];
  mode: "preview" | "play";
  answer?: string[];
  onAnswerChange?: (optionIds: string[]) => void;
}

export default function MultipleChoiceTaskRenderer({ title, description, imageUrl, options, correctOptionIds = [], mode, answer = [], onAnswerChange }: MultipleChoiceTaskRendererProps) {
  function toggleOption(optionId: string) {
    if (mode !== "play" || !onAnswerChange) return;
    onAnswerChange(answer.includes(optionId) ? answer.filter((id) => id !== optionId) : [...answer, optionId]);
  }

  return <article className="rounded-2xl bg-[#111827] p-6">
    <h2 className="text-2xl font-bold">{title}</h2>
    {description ? <p className="mt-3 text-slate-300">{description}</p> : null}
    {imageUrl ? <Image src={imageUrl} alt={`${title || "Task"} image`} width={1200} height={675} unoptimized className="mt-5 max-h-80 w-full rounded-xl object-cover" /> : null}
    <fieldset className="mt-6 space-y-3">
      <legend className="sr-only">Multiple choice options</legend>
      {options.map((option) => {
        const checked = mode === "preview" ? correctOptionIds.includes(option.id) : answer.includes(option.id);
        return <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-slate-100 transition has-[:checked]:border-violet-400 has-[:checked]:bg-violet-500/15">
          <input type="checkbox" checked={checked} onChange={() => toggleOption(option.id)} disabled={mode === "preview"} className="size-4 border-slate-600 bg-slate-950 text-violet-500 focus:ring-violet-500" />
          <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere]">{option.text}</span>
        </label>;
      })}
    </fieldset>
  </article>;
}
