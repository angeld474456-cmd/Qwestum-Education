"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

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
    if (questId) {
      loadTasks();
    }
  }, [questId]);

  async function loadTasks() {
    setLoading(true);

    try {
      const { data, error } = await getQuestTasks(questId);

      if (error) throw error;

      const loadedTasks = data ?? [];

      setTasks(loadedTasks);

      if (loadedTasks.length > 0) {
        if (!selectedTask) {
          setSelectedTask(loadedTasks[0]);
        } else {
          const current = loadedTasks.find(
            (t) => t.id === selectedTask.id
          );

          setSelectedTask(current ?? loadedTasks[0]);
        }
      } else {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить задания");
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
    try {
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

      if (error) throw error;

      await loadTasks();

      toast.success("Задание успешно создано");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось создать задание");
    }
  }

  async function handleSaveTask(
    id: string,
    title: string,
    description: string,
    answer: string,
    hint: string,
    points: number,
    taskType: string
  ) {
    try {
      const { error } = await updateTask(id, {
        title,
        description,
        answer,
        hint,
        points,
        task_type: taskType,
      });

      if (error) throw error;

      await loadTasks();

      toast.success("Изменения сохранены");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось сохранить изменения");
    }
  }

  async function handleUploadImage(
    taskId: string,
    file: File
  ) {
    try {
      const { url, error } = await uploadQuestImage(file);

      if (error || !url) {
        throw error ?? new Error("URL изображения не получен");
      }

      const { error: updateError } = await updateTask(taskId, {
        image_url: url,
      });

      if (updateError) throw updateError;

      await loadTasks();

      toast.success("Изображение успешно загружено");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить изображение");
    }
  }

  async function handleDeleteTask(id: string) {
    if (!confirm("Удалить задание?")) return;

    try {
      const { error } = await deleteTask(id);

      if (error) throw error;

      await loadTasks();

      toast.success("Задание удалено");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить задание");
    }
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-8">
      <div className="mx-auto max-w-7xl">

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