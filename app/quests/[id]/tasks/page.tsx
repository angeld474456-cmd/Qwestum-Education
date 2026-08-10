import { redirect } from "next/navigation";

type LegacyQuestTasksPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LegacyQuestTasksPage({
  params,
}: LegacyQuestTasksPageProps) {
  const { id } = await params;

  redirect(`/dashboard/quests/${id}/tasks`);
}
