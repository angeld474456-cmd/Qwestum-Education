"use client";

import Image from "next/image";
import { useState } from "react";

type PublicTaskImageProps = {
  imageUrl: string | null;
  title: string;
};

export default function PublicTaskImage({
  imageUrl,
  title,
}: PublicTaskImageProps) {
  const [hasLoadError, setHasLoadError] = useState(false);

  if (!imageUrl || hasLoadError) return null;

  return (
    <Image
      src={imageUrl}
      alt={title || "Task image"}
      width={1200}
      height={675}
      loading="lazy"
      unoptimized
      onError={() => setHasLoadError(true)}
      className="max-h-[420px] h-auto w-full rounded-md border border-slate-700 object-contain"
    />
  );
}
