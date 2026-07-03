"use client";

import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}

export default function AppShell({
  children,
  sidebar,
  header,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#070B14] text-white">

      <aside className="w-72 border-r border-slate-800 bg-[#0B1220]">
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col">

        <header className="h-16 border-b border-slate-800 bg-[#111827]">
          {header}
        </header>

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>

      </div>

    </div>
  );
}