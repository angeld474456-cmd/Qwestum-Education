import { notFound } from "next/navigation";

import QuestCoverImageManager from "@/components/dashboard/QuestCoverImageManager";
import QuestSettingsForm from "@/components/dashboard/QuestSettingsForm";
import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import { getSafeQuestCoverImagePublicUrl } from "@/lib/storage/quest-cover.server";
import { getTeacherSubjects } from "@/services/subject.server";
import { getOwnedQuest } from "@/services/teacher-quest.server";

type SettingsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherQuestSettingsPage({
  params,
}: SettingsPageProps) {
  const { id } = await params;
  const [quest, subjects] = await Promise.all([
    getOwnedQuest(id),
    getTeacherSubjects(),
  ]);

  if (!quest) {
    notFound();
  }

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Quest Settings
          </p>
          <h1 className="mt-2 text-4xl font-bold">{quest.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Edit basic quest metadata and control whether this quest is public
            or saved as a draft.
          </p>
        </div>

        <QuestWorkspaceNav questId={id} active="settings" />
      </div>

      <QuestCoverImageManager
        questId={quest.id}
        initialCoverImageUrl={getSafeQuestCoverImagePublicUrl(
          quest.cover_image_path,
          quest.author_id,
          quest.id
        )}
      />

      <QuestSettingsForm quest={quest} subjects={subjects} />
    </section>
  );
}
