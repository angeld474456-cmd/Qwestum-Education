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
  const firstRender = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void onSave();
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, delay, onSave, ...deps]);
}