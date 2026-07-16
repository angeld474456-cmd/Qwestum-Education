"use client";

import Image from "next/image";
import { useState } from "react";

export interface SingleChoiceRuntimeOption {
  id: string;
  text: string;
}

export interface SingleChoiceTaskRendererProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  options: SingleChoiceRuntimeOption[];
  correctOptionId: string;
  mode?: "preview" | "play";
  answer?: string;
  onAnswerChange?: (optionId: string) => void;
}

export default function SingleChoiceTaskRenderer({
  title,
  description,
  imageUrl,
  options,
  correctOptionId,
  mode = "preview",
  answer = "",
  onAnswerChange,
}: SingleChoiceTaskRendererProps) {
  const [selectedOptionId, setSelectedOptionId] = useState(answer);

  function handleOptionChange(optionId: string) {
    setSelectedOptionId(optionId);
    onAnswerChange?.(optionId);
  }

  return (
    <div className="rounded-2xl bg-[#1B2435] p-6">
      <h3 className="text-2xl font-bold">
        {title || "Название задания"}
      </h3>

      <p className="mt-3 text-slate-300">
        {description || "Описание задания"}
      </p>

      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${title || "Task"} image`}
          width={1200}
          height={675}
          unoptimized
          className="mt-5 max-h-[420px] w-full rounded-xl border border-slate-700 object-contain"
        />
      ) : null}

      <div className="mt-5 space-y-3">
        {options.length > 0 ? (
          options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 rounded-xl bg-[#111827] p-4"
            >
              <input
                type="radio"
                checked={
                  mode === "preview"
                    ? correctOptionId === option.id
                    : selectedOptionId === option.id
                }
                readOnly={mode === "preview"}
                onChange={() => handleOptionChange(option.id)}
              />

              <span>
                {option.text || "Вариант ответа"}
              </span>
            </label>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-600 p-4 text-slate-400">
            Варианты ответа пока не добавлены
          </div>
        )}
      </div>
    </div>
  );
}
