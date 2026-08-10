const questIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ClipboardWriter = {
  writeText(value: string): Promise<void>;
};

export function shouldShowPublicQuestShare(isPublic: boolean) {
  return isPublic;
}

export function getPublicQuestSharePath(questId: string) {
  if (!questIdPattern.test(questId)) return null;

  return `/catalog/${questId}`;
}

export function getPublicQuestShareUrl(questId: string, origin: string) {
  const path = getPublicQuestSharePath(questId);

  if (!path) return null;

  try {
    return new URL(path, new URL(origin).origin).toString();
  } catch {
    return null;
  }
}

export async function copyPublicQuestLink(
  questId: string,
  origin: string,
  clipboard: ClipboardWriter | undefined
) {
  const url = getPublicQuestShareUrl(questId, origin);

  if (!url || !clipboard) return "failed" as const;

  try {
    await clipboard.writeText(url);
    return "copied" as const;
  } catch {
    return "failed" as const;
  }
}
