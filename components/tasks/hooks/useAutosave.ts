"use client";

import { DependencyList, useEffect, useRef } from "react";

interface UseAutosaveOptions {
  enabled: boolean;
  delay?: number;
  deps: DependencyList;
  onSave: () => Promise<void>;
}

export function useAutosave({
  enabled,
  delay = 1000,
  deps,
  onSave,
}: UseAutosaveOptions) {
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      void onSaveRef.current();
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, delay, deps]);
}
