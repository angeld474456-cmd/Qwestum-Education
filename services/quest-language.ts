export type QuestLanguageCode = "ru" | "kk" | "en";

export const QUEST_LANGUAGE_OPTIONS = [
  {
    code: "ru",
    label: "Русский",
  },
  {
    code: "kk",
    label: "Казахский",
  },
  {
    code: "en",
    label: "Английский",
  },
] as const satisfies ReadonlyArray<{
  code: QuestLanguageCode;
  label: string;
}>;

const questLanguageLabels = new Map<QuestLanguageCode, string>(
  QUEST_LANGUAGE_OPTIONS.map((language) => [language.code, language.label])
);

export function isQuestLanguageCode(
  value: unknown
): value is QuestLanguageCode {
  return (
    typeof value === "string" &&
    questLanguageLabels.has(value as QuestLanguageCode)
  );
}

export function getQuestLanguageLabel(value: unknown) {
  if (!isQuestLanguageCode(value)) return null;

  return questLanguageLabels.get(value) ?? null;
}
