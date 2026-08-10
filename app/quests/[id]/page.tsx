import { redirect } from "next/navigation";

type QuestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuestPage({ params }: QuestPageProps) {
  const { id } = await params;

  redirect(`/dashboard/quests/${id}/preview`);
}
