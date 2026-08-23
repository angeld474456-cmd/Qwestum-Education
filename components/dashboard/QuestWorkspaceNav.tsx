import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Eye,
  FlaskConical,
  Settings,
  type LucideIcon,
} from "lucide-react";

type QuestWorkspaceNavActive =
  | "settings"
  | "preview"
  | "play"
  | "results"
  | "tasks";

type QuestWorkspaceNavProps = {
  questId: string;
  active: QuestWorkspaceNavActive;
};

type QuestWorkspaceTab = {
  active: QuestWorkspaceNavActive;
  icon: LucideIcon;
  iconMotionClass: string;
  label: string;
  path: string;
};

const backLinkClass =
  "group inline-flex h-11 items-center gap-2 rounded-xl border border-sky-200/20 bg-gradient-to-br from-[#172640] via-[#1A314D] to-[#203A56] px-4 text-sm font-semibold text-slate-100 transition-colors hover:border-sky-100/35 hover:from-[#1D304E] hover:via-[#254263] hover:to-[#2B506F] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]";

const inactiveTabClass =
  "group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl border border-violet-200/25 bg-gradient-to-br from-[#172553] via-[#2B2470] to-[#4A1E78] px-4 text-sm font-semibold text-slate-50 transition-colors hover:border-violet-200/45 hover:bg-gradient-to-br hover:from-[#20336B] hover:via-[#403092] hover:to-[#6A2399] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:bg-gradient-to-r before:from-transparent before:via-violet-100/20 before:to-transparent before:opacity-0 before:transition-[transform,opacity] before:duration-500 hover:before:translate-x-[300%] hover:before:opacity-100 focus-visible:before:translate-x-[300%] focus-visible:before:opacity-100 motion-reduce:before:transition-none";

const activeTabClass =
  "group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl border border-violet-100/50 bg-gradient-to-br from-[#14244F] via-[#2A2160] to-[#3E175F] px-4 text-sm font-semibold text-white shadow-sm shadow-black/40 transition hover:border-violet-100/65 hover:from-[#1B3067] hover:via-[#352977] hover:to-[#4D1D73] hover:shadow-md hover:shadow-black/45 focus-visible:border-violet-100/65 focus-visible:from-[#1B3067] focus-visible:via-[#352977] focus-visible:to-[#4D1D73] focus-visible:shadow-md focus-visible:shadow-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/40 hover:before:bg-white/50 focus-visible:before:bg-white/50 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-violet-100/35 hover:after:bg-violet-100/50 focus-visible:after:bg-violet-100/50 after:content-['']";

const tabs: QuestWorkspaceTab[] = [
  {
    active: "settings",
    icon: Settings,
    iconMotionClass: "group-hover:rotate-45 group-focus-visible:rotate-45",
    label: "Настройки",
    path: "settings",
  },
  {
    active: "tasks",
    icon: ClipboardList,
    iconMotionClass: "group-hover:scale-130 group-focus-visible:scale-130",
    label: "Задания",
    path: "tasks",
  },
  {
    active: "preview",
    icon: Eye,
    iconMotionClass: "group-hover:scale-105 group-focus-visible:scale-105",
    label: "Предпросмотр",
    path: "preview",
  },
  {
    active: "play",
    icon: FlaskConical,
    iconMotionClass: "group-hover:-rotate-45 group-focus-visible:-rotate-45",
    label: "Тестирование",
    path: "play",
  },
  {
    active: "results",
    icon: BarChart3,
    iconMotionClass:
      "group-hover:-translate-y-0.5 group-hover:scale-105 group-focus-visible:-translate-y-0.5 group-focus-visible:scale-105",
    label: "Результаты",
    path: "results",
  },
];

export default function QuestWorkspaceNav({
  questId,
  active,
}: QuestWorkspaceNavProps) {
  return (
    <nav
      className="flex flex-wrap items-center gap-3"
      aria-label="Навигация по квесту"
    >
      <Link href="/dashboard/quests" className={backLinkClass}>
        <ArrowLeft
          className="size-4 text-sky-100 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
        <span>К библиотеке</span>
      </Link>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Разделы квеста"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.active;

          return (
            <Link
              key={tab.active}
              href={`/dashboard/quests/${questId}/${tab.path}`}
              className={isActive ? activeTabClass : inactiveTabClass}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`relative z-10 size-4 transition-transform duration-200 motion-reduce:transition-none ${
                  isActive ? "text-white" : "text-[#E9D5FF]"
                } ${tab.iconMotionClass}`}
                aria-hidden="true"
              />
              <span className="relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
