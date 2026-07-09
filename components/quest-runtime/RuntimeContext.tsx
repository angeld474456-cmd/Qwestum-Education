"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { QuestTask } from "@/services/quest.service";

export type RuntimeAnswers = Record<string, string>;
export type RuntimeStatus = "start" | "playing" | "finished";

interface RuntimeContextValue {
  tasks: QuestTask[];
  status: RuntimeStatus;
  currentTask: QuestTask | null;
  currentIndex: number;
  totalTasks: number;
  answers: RuntimeAnswers;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progressPercent: number;
  setAnswer: (taskId: string, answer: string) => void;
  startQuest: () => void;
  finishQuest: () => void;
  restartQuest: () => void;
  goNext: () => void;
  goPrevious: () => void;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

interface RuntimeProviderProps {
  tasks: QuestTask[];
  children: ReactNode;
}

export function RuntimeProvider({
  tasks,
  children,
}: RuntimeProviderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<RuntimeAnswers>({});
  const [status, setStatus] = useState<RuntimeStatus>("start");

  const totalTasks = tasks.length;
  const currentTask = tasks[currentIndex] ?? null;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = status === "playing" && totalTasks > 0;
  const progressPercent =
    totalTasks > 0 ? ((currentIndex + 1) / totalTasks) * 100 : 0;

  function setAnswer(taskId: string, answer: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [taskId]: answer,
    }));
  }

  function startQuest() {
    setCurrentIndex(0);
    setStatus("playing");
  }

  function finishQuest() {
    setStatus("finished");
  }

  function restartQuest() {
    setAnswers({});
    setCurrentIndex(0);
    setStatus("start");
  }

  function goNext() {
    if (currentIndex >= totalTasks - 1) {
      finishQuest();
      return;
    }

    setCurrentIndex((index) =>
      Math.min(index + 1, Math.max(totalTasks - 1, 0))
    );
  }

  function goPrevious() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  const value: RuntimeContextValue = {
    tasks,
    status,
    currentTask,
    currentIndex,
    totalTasks,
    answers,
    canGoNext,
    canGoPrevious,
    progressPercent,
    setAnswer,
    startQuest,
    finishQuest,
    restartQuest,
    goNext,
    goPrevious,
  };

  return (
    <RuntimeContext.Provider value={value}>
      {children}
    </RuntimeContext.Provider>
  );
}

export function useRuntimeContext() {
  const context = useContext(RuntimeContext);

  if (!context) {
    throw new Error("useRuntimeContext must be used inside RuntimeProvider");
  }

  return context;
}
