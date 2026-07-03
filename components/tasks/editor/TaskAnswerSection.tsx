"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TaskAnswerSectionProps {
  answer: string;
  hint: string;
  onAnswerChange: (value: string) => void;
  onHintChange: (value: string) => void;
}

export default function TaskAnswerSection({
  answer,
  hint,
  onAnswerChange,
  onHintChange,
}: TaskAnswerSectionProps) {
  return (
    <Card>

      <CardHeader>
        <CardTitle>
          Ответ и подсказка
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Правильный ответ
          </label>

          <Input
            value={answer}
            placeholder="Введите правильный ответ..."
            onChange={(e) => onAnswerChange(e.target.value)}
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Подсказка
          </label>

          <Textarea
            rows={4}
            value={hint}
            placeholder="Введите подсказку..."
            onChange={(e) => onHintChange(e.target.value)}
          />

        </div>

      </CardContent>

    </Card>
  );
}