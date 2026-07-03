"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  BookOpen,
  Image,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";

const menu = [
  {
    title: "Панель",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Квесты",
    href: "/quests",
    icon: BookOpen,
  },
  {
    title: "Задания",
    href: "/tasks",
    icon: ScrollText,
  },
  {
    title: "Медиа",
    href: "/media",
    icon: Image,
  },
  {
    title: "Учителя",
    href: "/teachers",
    icon: Users,
  },
  {
    title: "ИИ Конструктор",
    href: "/ai",
    icon: Sparkles,
  },
  {
    title: "Настройки",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">

      <div className="border-b border-slate-800 p-6">

        <h1 className="text-3xl font-bold text-violet-400">
          Questum
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Education Platform
        </p>

      </div>

      <nav className="flex-1 space-y-2 p-4">

        {menu.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} />

              <span>{item.title}</span>
            </Link>
          );
        })}

      </nav>

      <div className="border-t border-slate-800 p-6">

        <div className="rounded-xl bg-slate-800 p-4">

          <div className="text-sm text-slate-400">
            Версия
          </div>

          <div className="mt-1 font-semibold">
            Questum 2.0
          </div>

        </div>

      </div>

    </div>
  );
}