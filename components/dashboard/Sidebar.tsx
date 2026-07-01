"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  School,
  Settings,
  User,
} from "lucide-react";

const menu = [
  {
    title: "Главная",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Каталог квестов",
    href: "/catalog",
    icon: BookOpen,
  },
  {
    title: "AI Studio",
    href: "/ai",
    icon: BrainCircuit,
  },
  {
    title: "Ученики",
    href: "/students",
    icon: GraduationCap,
  },
  {
    title: "Школы",
    href: "/schools",
    icon: School,
  },
  {
    title: "Профиль",
    href: "/profile",
    icon: User,
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
    <aside className="w-72 border-r border-slate-800 bg-[#0B1220]">

      <div className="p-8">

        <h1 className="text-3xl font-black text-white">
          Questum
        </h1>

        <p className="mt-2 text-slate-400">
          Education Platform
        </p>

      </div>

      <nav className="px-4">

        {menu.map((item) => {
          const Icon = item.icon;

          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-2 flex items-center gap-4 rounded-2xl px-5 py-4 transition

              ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={22} />

              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}