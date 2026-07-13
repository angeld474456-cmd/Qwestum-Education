import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0B1220] p-6">
      <h2 className="text-3xl font-bold text-white">
        Questum
      </h2>

      <p className="mt-2 text-slate-400">
        Education Platform
      </p>

      <nav className="mt-10 space-y-4">
        <Link href="/dashboard" className="block text-slate-300 hover:text-white">
          Dashboard
        </Link>

        <Link href="/dashboard/quests" className="block text-slate-300 hover:text-white">
          My Quests
        </Link>

        <div
          aria-disabled="true"
          className="flex cursor-not-allowed items-center justify-between text-slate-500"
        >
          <span>Catalog</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            Coming soon
          </span>
        </div>

        <div
          aria-disabled="true"
          className="flex cursor-not-allowed items-center justify-between text-slate-500"
        >
          <span>Students</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            Coming soon
          </span>
        </div>

        <div
          aria-disabled="true"
          className="flex cursor-not-allowed items-center justify-between text-slate-500"
        >
          <span>Schools</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            Coming soon
          </span>
        </div>

        <div
          aria-disabled="true"
          className="flex cursor-not-allowed items-center justify-between text-slate-500"
        >
          <span>Settings</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            Coming soon
          </span>
        </div>
      </nav>
    </aside>
  );
}
