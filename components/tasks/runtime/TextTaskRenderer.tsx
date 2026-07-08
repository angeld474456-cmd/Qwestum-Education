"use client";

import { useState } from "react";

export interface TextTaskRendererProps {
  title: string;
  description: string;
  mode?: "preview" | "play";
  onAnswerChange?: (answer: string) => void;
}

export default function TextTaskRenderer({
  title,
  description,
  mode = "preview",
  onAnswerChange,
}: TextTaskRendererProps) {
  const [answer, setAnswer] = useState("");

  function handleAnswerChange(value: string) {
    setAnswer(value);
    onAnswerChange?.(value);
  }

  return (
    <div className="rounded-2xl bg-[#1B2435] p-6">
      <h3 className="text-2xl font-bold">
        {title || "Название задания"}
      </h3>

      <p className="mt-3 text-slate-300">
        {description || "Описание задания"}
      </p>

      {mode === "play" && (
        <textarea
          rows={4}
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="mt-5 w-full rounded-xl bg-[#111827] p-4"
        />
      )}
    </div>
  );
}
