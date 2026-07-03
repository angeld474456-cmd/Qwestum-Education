"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TaskMediaSectionProps {
  imageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
}

export default function TaskMediaSection({
  imageUrl,
  onUpload,
}: TaskMediaSectionProps) {
  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    await onUpload(file);
  }

  return (
    <Card>

      <CardHeader>
        <CardTitle>
          Медиафайлы
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {imageUrl ? (

          <div className="overflow-hidden rounded-xl border border-slate-700">

            <Image
              src={imageUrl}
              alt="Task"
              width={1200}
              height={800}
              className="h-auto w-full object-cover"
            />

          </div>

        ) : (

          <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 text-slate-400">

            <ImagePlus
              className="mb-3"
              size={42}
            />

            <p>
              Изображение ещё не загружено
            </p>

          </div>

        )}

        <div className="flex gap-3">

          <Button
            asChild
            className="cursor-pointer"
          >
            <label>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              📤 Загрузить изображение

            </label>
          </Button>

          {imageUrl && (

            <Button
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />

              Удалить

            </Button>

          )}

        </div>

      </CardContent>

    </Card>
  );
}