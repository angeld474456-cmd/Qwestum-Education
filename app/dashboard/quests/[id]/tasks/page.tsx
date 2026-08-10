import { notFound, redirect } from "next/navigation";

import QuestTasksClient from "@/components/tasks/QuestTasksClient";
import type { QuestTask } from "@/services/quest.service";
import {
  getCurrentTeacherUser,
  getOwnedQuest,
  getOwnedQuestTasks,
} from "@/services/teacher-quest.server";

type QuestTasksPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuestTasksPage({
  params,
}: QuestTasksPageProps) {
  const { id } = await params;
  const user = await getCurrentTeacherUser();

  if (!user) {
    redirect("/login");
  }

  const quest = await getOwnedQuest(id);

  if (!quest) {
    notFound();
  }

  const tasks = await getOwnedQuestTasks(id);

  if (!tasks) {
    notFound();
  }

  return <QuestTasksClient questId={id} initialTasks={tasks as QuestTask[]} />;
}
