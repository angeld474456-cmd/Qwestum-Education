"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import TaskEditor from "@/components/tasks/TaskEditor";

import {
  QuestTask,
  getQuestTasks,
  createTask,
  deleteTask,
  updateTask,
} from "@/services/quest.service";

import { uploadQuestImage } from "@/services/storage.service";

export default function QuestTasksPage() {
  const params = useParams();
  const questId = params.id as string;

  const [tasks, setTasks] = useState<QuestTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<QuestTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!questId) return;

    async function loadInitialTasks() {
      setLoading(true);

      const { data, error } = await getQuestTasks(questId);

      if (error) {
        alert(JSON.stringify(error, null, 2));
        setLoading(false);
        return;
      }

      const loadedTasks = data ?? [];

      setTasks(loadedTasks);

      setSelectedTask((currentTask) => {
        if (loadedTasks.length > 0) {
          if (!currentTask) {
            return loadedTasks[0];
          }

          const current = loadedTasks.find(
            (t) => t.id === currentTask.id
          );

          if (current) {
            return current;
          }

          return loadedTasks[0];
        }

        return null;
      });

      setLoading(false);
    }

    loadInitialTasks();
  }, [questId]);

  async function loadTasks() {
    setLoading(true);

    const { data, error } = await getQuestTasks(questId);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      setLoading(false);
      return;
    }

    const loadedTasks = data ?? [];

    setTasks(loadedTasks);

    setSelectedTask((currentTask) => {
      if (loadedTasks.length > 0) {
        if (!currentTask) {
          return loadedTasks[0];
        }

        const current = loadedTasks.find(
          (t) => t.id === currentTask.id
        );

        if (current) {
          return current;
        }

        return loadedTasks[0];
      }

      return null;
    });

    setLoading(false);
  }

  async function handleCreateTask(task: {
    title: string;
    description: string;
    answer: string;
    hint: string;
    points: number;
    taskType: string;
  }) {
    const { error } = await createTask({
      quest_id: questId,
      title: task.title,
      description: task.description,
      answer: task.answer,
      hint: task.hint,
      image_url: "",
      video_url: "",
      audio_url: "",
      points: task.points,
      task_type: task.taskType,
      sort_order: tasks.length + 1,
    });

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    await loadTasks();
  }

  async function handleSaveTask(
    id: string,
    title: string,
    description: string
  ) {
    const { error } = await updateTask(id, {
      title,
      description,
    });

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    await loadTasks();

    alert("✅ Изменения сохранены");
  }

  async function handleUploadImage(
    taskId: string,
    file: File
  ) {
    const { url, error } = await uploadQuestImage(file);

    if (error || !url) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    const { error: updateError } = await updateTask(taskId, {
      image_url: url,
    });

    if (updateError) {
      alert(JSON.stringify(updateError, null, 2));
      return;
    }

    await loadTasks();

    alert("🖼 Изображение загружено");
  }

  async function handleDeleteTask(id: string) {
    if (!confirm("Удалить задание?")) return;

    const { error } = await deleteTask(id);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    await loadTasks();
  }

  return (
    <main className="h-screen overflow-y-auto bg-[#070B14] text-white p-8">
      <div className="mx-auto max-w-7xl pb-8">

        <h1 className="text-4xl font-bold">
          Конструктор Questum
        </h1>

        <p className="mt-3 text-slate-400">
          Управление заданиями
        </p>

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

          </div>

          <div className="col-span-8">

            <TaskEditor
              task={selectedTask}
              onSave={handleSaveTask}
              onUploadImage={handleUploadImage}
            />

          </div>

        </div>

      </div>
    </main>
  );
}
