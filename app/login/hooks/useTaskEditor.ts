"use client";

import { useEffect, useState } from "react";
import { QuestTask } from "@/services/quest.service";

export function useTaskEditor(task: QuestTask | null) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [points, setPoints] = useState(1);
  const [taskType, setTaskType] = useState("text");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!task) {
      setTitle("");
      setDescription("");
      setAnswer("");
      setHint("");
      setPoints(1);
      setTaskType("text");
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setAnswer(task.answer ?? "");
    setHint(task.hint ?? "");
    setPoints(task.points);
    setTaskType(task.task_type);

    setSaved(true);
    setSaving(false);
    setError(null);

  }, [task]);

  return {

    title,
    description,
    answer,
    hint,
    points,
    taskType,

    setTitle,
    setDescription,
    setAnswer,
    setHint,
    setPoints,
    setTaskType,

    saving,
    setSaving,

    saved,
    setSaved,

    error,
    setError,

  };
}