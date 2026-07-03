"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#111827] px-6">

      <div>

        <h1 className="text-2xl font-bold">
          Questum Dashboard
        </h1>

        <p className="text-sm text-slate-400">
          Панель управления
        </p>

      </div>

      <div className="flex items-center gap-4">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 -translate-x-0 text-slate-500"
          />

          <input
            placeholder="Поиск..."
            className="w-72 rounded-xl border border-slate-700 bg-[#1B2435] py-2 pl-10 pr-4 outline-none transition focus:border-violet-500"
          />

        </div>

        <button className="rounded-xl bg-[#1B2435] p-2 hover:bg-slate-700 transition">

          <Bell size={20} />

        </button>

        <button className="flex items-center gap-3 rounded-xl bg-[#1B2435] px-4 py-2 hover:bg-slate-700 transition">

          <UserCircle2 size={30} />

          <div>

            <div className="font-semibold">
              Андрей
            </div>

            <div className="text-xs text-slate-400">
              Администратор
            </div>

          </div>

        </button>

      </div>

    </header>
  );
}