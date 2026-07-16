import Link from "next/link";

type DashboardHeaderProps = {
  teacherEmail?: string;
};

export default function DashboardHeader({
  teacherEmail,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-[#0B1220] px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Панель управления
          </h1>

          <p className="mt-2 text-slate-400">
            Добро пожаловать в Questum
          </p>
        </div>

        <div className="flex items-center gap-4">
          {teacherEmail ? (
            <p className="max-w-64 truncate text-sm text-slate-400">
              {teacherEmail}
            </p>
          ) : null}

          <Link
            href="/quests/new"
            className="rounded-xl bg-violet-600 px-6 py-3 text-white hover:bg-violet-700"
          >
            Создать квест
          </Link>

          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
