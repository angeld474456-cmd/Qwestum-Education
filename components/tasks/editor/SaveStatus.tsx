"use client";

interface SaveStatusProps {
  status: "idle" | "saving" | "saved" | "error";
}

export default function SaveStatus({
  status,
}: SaveStatusProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "saving") {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300">
        ⏳ Сохранение...
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
        ✅ Все изменения сохранены
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
      ❌ Ошибка сохранения
    </div>
  );
}