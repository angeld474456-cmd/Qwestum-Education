import Link from "next/link";

type QuestWorkspaceNavActive = "settings" | "preview" | "play" | "results" | "tasks";

type QuestWorkspaceNavProps = {
  questId: string;
  active: QuestWorkspaceNavActive;
};

const inactiveLinkClass =
  "rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600";

const activeLinkClass =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700";

function getLinkClass(
  active: QuestWorkspaceNavActive,
  current: QuestWorkspaceNavActive
) {
  return active === current ? activeLinkClass : inactiveLinkClass;
}

export default function QuestWorkspaceNav({
  questId,
  active,
}: QuestWorkspaceNavProps) {
  return (
    <nav className="flex flex-wrap gap-3" aria-label="Quest workspace">
      <Link href="/dashboard/quests" className={inactiveLinkClass}>
        К библиотеке
      </Link>

      <Link
        href={`/dashboard/quests/${questId}/settings`}
        className={getLinkClass(active, "settings")}
      >
        Настройки
      </Link>

      <Link
        href={`/dashboard/quests/${questId}/tasks`}
        className={getLinkClass(active, "tasks")}
      >
        Задания
      </Link>

      <Link
        href={`/dashboard/quests/${questId}/preview`}
        className={getLinkClass(active, "preview")}
      >
        Предпросмотр
      </Link>

      <Link
        href={`/dashboard/quests/${questId}/play`}
        className={getLinkClass(active, "play")}
      >
        Тестирование
      </Link>
      <Link
        href={`/dashboard/quests/${questId}/results`}
        className={getLinkClass(active, "results")}
      >
        {"\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b"}
      </Link>
    </nav>
  );
}
