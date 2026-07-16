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

    try {
      const response = await fetch(`/api/teacher/quests/${questId}/tasks`);

      if (isSessionExpiredResponse(response)) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        redirectToSessionExpiredLogin();
        return;
      }

      const result = (await response.json()) as TasksResponse;

      if (!response.ok || !result.tasks) {
        setErrorMessage(result.error ?? "Unable to load tasks.");
        return;
      }

      setTasks(result.tasks);
      syncSelectedTask(result.tasks);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to load tasks.");
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
  }) {
    if (busy) return;

    setBusy(true);
    setErrorMessage("");

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
        return;
      }

      const result = (await response.json()) as TasksResponse;

      if (!response.ok || !result.task) {
        setErrorMessage(result.error ?? "Unable to create task.");
        return;
      }

      const nextTasks = [...tasks, result.task];
      setTasks(nextTasks);
      setSelectedTask(result.task);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to create task.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTask(
    id: string,
    title: string,
    description: string,
    content?: TaskContent | null
  ) {
    if (busy) return;

    setBusy(true);
    setErrorMessage("");

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
        setErrorMessage(result.error ?? "Unable to save task.");
        return;
      }

      const nextTasks = tasks.map((task) =>
        task.id === result.task?.id ? result.task : task
      );
      setTasks(nextTasks);
      setSelectedTask(result.task);

      alert("✅ Изменения сохранены");
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to save task.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadImage(taskId: string, file: File) {
    if (busy) return;

    setBusy(true);
    setErrorMessage("");

    try {
      const { imageUrl, error } = await uploadQuestImage(
        questId,
        taskId,
        file
      );

      if (error || !imageUrl) {
        setErrorMessage(error ?? "Unable to upload image.");
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
        setErrorMessage(result.error ?? "Unable to save image.");
        return;
      }

      const nextTasks = tasks.map((task) =>
        task.id === result.task?.id ? result.task : task
      );
      setTasks(nextTasks);
      setSelectedTask(result.task);

      alert("🖼 Изображение загружено");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage("Unable to upload image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveImage(taskId: string) {
    if (busy) return;
    if (!confirm("Remove image from this task?")) return;

    setBusy(true);
    setErrorMessage("");

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
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
        setErrorMessage(SESSION_EXPIRED_MESSAGE);
        return;
      }

      console.error(error);
      setErrorMessage("Unable to remove image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTask(id: string) {
    if (busy) return;
    if (!confirm("Удалить задание?")) return;

    setBusy(true);
    setErrorMessage("");

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
        setErrorMessage(result.error ?? "Unable to delete task.");
        return;
      }

      const nextTasks = tasks.filter((task) => task.id !== id);
      setTasks(nextTasks);
      syncSelectedTask(nextTasks);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to delete task.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="h-screen overflow-y-auto bg-[#070B14] p-8 text-white">
      <div className="mx-auto max-w-7xl pb-8">
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
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8">
          <TaskForm onSave={handleCreateTask} />
        </div>

        <div className="mt-10 grid grid-cols-12 gap-6">
          <div className="col-span-4">
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
              Refresh tasks
            </button>
          </div>

          <div className="col-span-8">
            <TaskEditor
              task={selectedTask}
              onSave={handleSaveTask}
              onUploadImage={handleUploadImage}
              onRemoveImage={handleRemoveImage}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
