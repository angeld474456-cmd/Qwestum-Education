"use client";

import { useState } from "react";

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import TaskEditor from "@/components/tasks/TaskEditor";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import {
  removeQuestImage,
  uploadQuestImage,
} from "@/services/storage.service";
import type { QuestTask, TaskContent } from "@/services/quest.service";
import {
  isSessionExpiredResponse,
  redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";

type QuestTasksClientProps = {
  questId: string;
  initialTasks: QuestTask[];
};

type TasksResponse = {
  tasks?: QuestTask[];
  task?: QuestTask;
  error?: string;
};

export default function QuestTasksClient({
  questId,
  initialTasks,
}: QuestTasksClientProps) {
  const [tasks, setTasks] = useState<QuestTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<QuestTask | null>(
    initialTasks[0] ?? null
  );
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  function syncSelectedTask(loadedTasks: QuestTask[]) {
    setSelectedTask((currentTask) => {
      if (loadedTasks.length === 0) return null;
      if (!currentTask) return loadedTasks[0];

      return (
        loadedTasks.find((task) => task.id === currentTask.id) ??
        loadedTasks[0]
      );
    });
  }

  async function loadTasks() {
    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/teacher/quests/${questId}/tasks`);

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        redirectToSessionExpiredLogin();
        return;
      }

      const result = (await response.json()) as TasksResponse;

      if (!response.ok || !result.tasks) {
        setErrorMessage(result.error ?? "Не удалось загрузить задания.");
        return;
      }

      setTasks(result.tasks);
      syncSelectedTask(result.tasks);
    } catch (error) {
      console.error(error);
      setErrorMessage("Не удалось загрузить задания.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(task: {
    title: string;
    description: string;
    answer: string;
    hint: string;
    points: number;
    taskType: string;
  }): Promise<boolean> {
    if (busy) return false;

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/teacher/quests/${questId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          answer: task.answer,
          hint: task.hint,
          points: task.points,
          task_type: task.taskType,
        }),
      });

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        redirectToSessionExpiredLogin();
        return false;
      }

      const result = (await response.json()) as TasksResponse;

      if (!response.ok || !result.task) {
        setErrorMessage(result.error ?? "Не удалось создать задание.");
        return false;
      }

      const nextTasks = [...tasks, result.task];
      setTasks(nextTasks);
      setSelectedTask(result.task);
      setStatusMessage("Задание создано.");
      return true;
    } catch (error) {
      console.error(error);
      setErrorMessage("Не удалось создать задание.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTask(
    id: string,
    title: string,
    description: string,
    points: number,
    content?: TaskContent | null
  ) {
    if (busy) return;

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(
        `/api/teacher/quests/${questId}/tasks/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            points,
            ...(content !== undefined ? { content } : {}),
          }),
        }
      );

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        redirectToSessionExpiredLogin();
        return;
      }

      const result = (await response.json()) as TasksResponse;

      if (!response.ok || !result.task) {
        setErrorMessage(result.error ?? "Не удалось сохранить задание.");
        return;
      }

      const nextTasks = tasks.map((task) =>
        task.id === result.task?.id ? result.task : task
      );
      setTasks(nextTasks);
      setSelectedTask(result.task);
      setStatusMessage("Изменения сохранены.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Не удалось сохранить задание.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadImage(taskId: string, file: File) {
    if (busy) return;

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const { imageUrl, error } = await uploadQuestImage(
        questId,
        taskId,
        file
      );

      if (error || !imageUrl) {
        setErrorMessage(error ?? "Не удалось загрузить изображение.");
        return;
      }

      const response = await fetch(
        `/api/teacher/quests/${questId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
          }),
        }
      );

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        redirectToSessionExpiredLogin();
        return;
      }

      const result = (await response.json()) as TasksResponse;

      if (!response.ok || !result.task) {
        setErrorMessage(result.error ?? "Не удалось сохранить изображение.");
        return;
      }

      const nextTasks = tasks.map((task) =>
        task.id === result.task?.id ? result.task : task
      );
      setTasks(nextTasks);
      setSelectedTask(result.task);
      setStatusMessage("Изображение загружено.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage("Не удалось загрузить изображение.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveImage(taskId: string) {
    if (busy) return;
    if (!confirm("Удалить изображение задания?")) return;

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const { error } = await removeQuestImage(questId, taskId);

      if (error) {
        setErrorMessage(error);
        return;
      }

      const nextTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, image_url: null } : task
      );
      setTasks(nextTasks);
      setSelectedTask((currentTask) =>
        currentTask?.id === taskId
          ? { ...currentTask, image_url: null }
          : currentTask
      );
      setStatusMessage("Изображение удалено.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage("Не удалось удалить изображение.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTask(id: string) {
    if (busy) return;
    if (!confirm("Удалить задание?")) return;

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(
        `/api/teacher/quests/${questId}/tasks/${id}`,
        {
          method: "DELETE",
        }
      );

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        redirectToSessionExpiredLogin();
        return;
      }

      const result = (await response.json()) as TasksResponse;

      if (!response.ok) {
        setErrorMessage(result.error ?? "Не удалось удалить задание.");
        return;
      }

      const nextTasks = tasks.filter((task) => task.id !== id);
      setTasks(nextTasks);
      syncSelectedTask(nextTasks);
      setStatusMessage("Задание удалено.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Не удалось удалить задание.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="text-white">
      <div className="max-w-7xl pb-8">
        <h1 className="text-4xl font-bold">
          Конструктор Questum
        </h1>

        <p className="mt-3 text-slate-400">
          Управление заданиями
        </p>

        <div className="mt-6">
          <QuestWorkspaceNav questId={questId} active="tasks" />
        </div>

        {errorMessage ? (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {errorMessage}
          </div>
        ) : null}

        {statusMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-8">
          <TaskForm onSave={handleCreateTask} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <h2 className="mb-4 text-2xl font-bold">
              Задания
            </h2>

            {loading ? (
              <div className="rounded-xl bg-[#111827] p-8">
                Загрузка...
              </div>
            ) : (
              <TaskList
                tasks={tasks}
                selectedTaskId={selectedTask?.id ?? null}
                onSelectTask={setSelectedTask}
                onDelete={handleDeleteTask}
              />
            )}

            <button
              type="button"
              onClick={loadTasks}
              disabled={loading || busy}
              className="mt-4 rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-600 disabled:opacity-50"
            >
              Обновить список
            </button>
          </div>

          <div className="xl:col-span-8">
            <TaskEditor
              task={selectedTask}
              onSave={handleSaveTask}
              onUploadImage={handleUploadImage}
              onRemoveImage={handleRemoveImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
