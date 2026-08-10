export type TeacherQuestLibraryFilterQuest = {
  title: string;
  description: string | null;
  category: string | null;
  tags: unknown;
};

export type TeacherQuestLibraryFilters = {
  search: string;
  category: string;
  tag: string;
};

export function normalizeTeacherQuestLibraryFilterValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getTeacherQuestLibrarySearchParam(value: unknown) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (typeof firstValue !== "string") return "";

  return normalizeTeacherQuestLibraryFilterValue(firstValue);
}

export function getTeacherQuestLibraryTags(
  quest: TeacherQuestLibraryFilterQuest
) {
  return Array.isArray(quest.tags)
    ? quest.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map(normalizeTeacherQuestLibraryFilterValue)
        .filter(Boolean)
    : [];
}

export function getTeacherQuestLibraryCategory(
  quest: TeacherQuestLibraryFilterQuest
) {
  if (typeof quest.category !== "string") return null;

  return normalizeTeacherQuestLibraryFilterValue(quest.category) || null;
}

export function getTeacherQuestLibraryFilterKey(value: string) {
  return value.toLocaleLowerCase("en");
}

function matchesTeacherQuestLibrarySearch(
  quest: TeacherQuestLibraryFilterQuest,
  search: string
) {
  if (!search) return true;

  const searchKey = getTeacherQuestLibraryFilterKey(search);
  const fields = [quest.title, quest.description];

  return fields.some(
    (value) =>
      typeof value === "string" &&
      getTeacherQuestLibraryFilterKey(
        normalizeTeacherQuestLibraryFilterValue(value)
      ).includes(searchKey)
  );
}

export function matchesTeacherQuestLibraryFilters(
  quest: TeacherQuestLibraryFilterQuest,
  filters: TeacherQuestLibraryFilters
) {
  if (!matchesTeacherQuestLibrarySearch(quest, filters.search)) {
    return false;
  }

  const categoryKey = filters.category
    ? getTeacherQuestLibraryFilterKey(filters.category)
    : "";
  const tagKey = filters.tag
    ? getTeacherQuestLibraryFilterKey(filters.tag)
    : "";

  if (categoryKey) {
    const questCategory = getTeacherQuestLibraryCategory(quest);

    if (
      !questCategory ||
      getTeacherQuestLibraryFilterKey(questCategory) !== categoryKey
    ) {
      return false;
    }
  }

  if (tagKey) {
    const questTagKeys = getTeacherQuestLibraryTags(quest).map(
      getTeacherQuestLibraryFilterKey
    );

    if (!questTagKeys.includes(tagKey)) {
      return false;
    }
  }

  return true;
}
