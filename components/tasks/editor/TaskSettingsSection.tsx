"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskSettingsSectionProps {
  taskType: string;
  points: number;
  onTaskTypeChange: (value: string) => void;
  onPointsChange: (value: number) => void;
}

const taskTypes = [
  { value: "text", label: "📝 Текст" },
  { value: "quiz", label: "✅ Тест" },
  { value: "multi", label: "☑️ Несколько ответов" },
  { value: "image", label: "🖼 Изображение" },
  { value: "video", label: "🎥 Видео" },
  { value: "audio", label: "🎵 Аудио" },
  { value: "pdf", label: "📄 PDF" },
  { value: "qr", label: "📷 QR-код" },
  { value: "map", label: "🗺 Карта" },
  { value: "timer", label: "⏱ Таймер" },
  { value: "ai", label: "🤖 AI-задание" },
];

export default function TaskSettingsSection({
  taskType,
  points,
  onTaskTypeChange,
  onPointsChange,
}: TaskSettingsSectionProps) {
  return (
    <Card>

      <CardHeader>
        <CardTitle>
          Настройки задания
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Тип задания
          </label>

          <Select
            value={taskType}
            onValueChange={onTaskTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>

            <SelectContent>
              {taskTypes.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>

          </Select>

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Баллы
          </label>

          <Input
            type="number"
            min={1}
            value={points}
            onChange={(e) =>
              onPointsChange(Number(e.target.value))
            }
          />

        </div>

      </CardContent>

    </Card>
  );
}