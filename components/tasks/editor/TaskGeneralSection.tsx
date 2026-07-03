"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskGeneralSectionProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export default function TaskGeneralSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: TaskGeneralSectionProps) {
  return (
    <Card>

      <CardHeader>
        <CardTitle>
          Основная информация
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Название задания
          </label>

          <Input
            value={title}
            placeholder="Введите название..."
            onChange={(e) => onTitleChange(e.target.value)}
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Описание задания
          </label>

          <Textarea
            rows={6}
            value={description}
            placeholder="Введите описание..."
            onChange={(e) => onDescriptionChange(e.target.value)}
          />

        </div>

      </CardContent>

    </Card>
  );
}