export type QuestLanguageCode = "ru" | "kk" | "en";

export const QUEST_LANGUAGE_OPTIONS = [
  {
    code: "ru",
    label: "Russian",
  },
  {
    code: "kk",
    label: "Kazakh",
  },
  {
    code: "en",
    label: "English",
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
