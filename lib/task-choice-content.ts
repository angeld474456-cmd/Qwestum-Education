export type ChoiceOption = { id: string; text: string };

export type SingleChoiceContent = {
  options: ChoiceOption[];
  correctOptionId: string;
};

export type MultipleChoiceContent = {
  options: ChoiceOption[];
  correctOptionIds: string[];
};

export type ChoiceContentState<T> =
  | { state: "draft" }
  | { state: "valid"; content: T }
  | { state: "malformed" };

export type ChoiceContentError =
  | "invalid_option_count"
  | "invalid_options"
  | "invalid_correct_option";

export const MAX_CHOICE_OPTIONS = 100;
export const MAX_CHOICE_OPTION_ID_LENGTH = 128;
export const MAX_CHOICE_OPTION_TEXT_LENGTH = 4000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonBlankString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function parseOptions(value: unknown): { options: ChoiceOption[] } | { error: ChoiceContentError } {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_CHOICE_OPTIONS) {
    return { error: "invalid_option_count" };
  }

  const ids = new Set<string>();
  const normalizedTexts = new Set<string>();
  const options: ChoiceOption[] = [];

  for (const option of value) {
    if (
      !isPlainObject(option) ||
      !isNonBlankString(option.id, MAX_CHOICE_OPTION_ID_LENGTH) ||
      !isNonBlankString(option.text, MAX_CHOICE_OPTION_TEXT_LENGTH) ||
      ids.has(option.id)
    ) {
      return { error: "invalid_options" };
    }

    const normalizedText = option.text.trim().toLowerCase();
    if (normalizedTexts.has(normalizedText)) return { error: "invalid_options" };

    ids.add(option.id);
    normalizedTexts.add(normalizedText);
    options.push({ id: option.id, text: option.text });
  }

  return { options };
}

export function getSingleChoiceContentError(value: unknown): ChoiceContentError | null {
  if (!isPlainObject(value)) return "invalid_options";

  const optionsResult = parseOptions(value.options);
  if ("error" in optionsResult) return optionsResult.error;

  if (
    !isNonBlankString(value.correctOptionId, MAX_CHOICE_OPTION_ID_LENGTH) ||
    !optionsResult.options.some((option) => option.id === value.correctOptionId)
  ) {
    return "invalid_correct_option";
  }

  return null;
}

export function getMultipleChoiceContentError(value: unknown): ChoiceContentError | null {
  if (!isPlainObject(value)) return "invalid_options";

  const optionsResult = parseOptions(value.options);
  if ("error" in optionsResult) return optionsResult.error;

  if (
    !Array.isArray(value.correctOptionIds) ||
    value.correctOptionIds.length < 2 ||
    value.correctOptionIds.length > MAX_CHOICE_OPTIONS
  ) {
    return "invalid_correct_option";
  }

  const optionIds = new Set(optionsResult.options.map((option) => option.id));
  const correctOptionIds = new Set<string>();
  for (const optionId of value.correctOptionIds) {
    if (
      !isNonBlankString(optionId, MAX_CHOICE_OPTION_ID_LENGTH) ||
      !optionIds.has(optionId) ||
      correctOptionIds.has(optionId)
    ) {
      return "invalid_correct_option";
    }
    correctOptionIds.add(optionId);
  }

  return null;
}

export function parseSingleChoiceContent(value: unknown): SingleChoiceContent | null {
  if (!isPlainObject(value) || getSingleChoiceContentError(value)) {
    return null;
  }

  const options = parseOptions(value.options);
  if ("error" in options) return null;

  return { options: options.options, correctOptionId: value.correctOptionId as string };
}

export function parseMultipleChoiceContent(value: unknown): MultipleChoiceContent | null {
  if (!isPlainObject(value) || getMultipleChoiceContentError(value)) {
    return null;
  }

  const options = parseOptions(value.options);
  if ("error" in options) return null;

  return { options: options.options, correctOptionIds: [...(value.correctOptionIds as string[])] };
}

export function classifySingleChoiceContent(value: unknown): ChoiceContentState<SingleChoiceContent> {
  if (value === null) return { state: "draft" };

  const content = parseSingleChoiceContent(value);
  return content ? { state: "valid", content } : { state: "malformed" };
}

export function classifyMultipleChoiceContent(value: unknown): ChoiceContentState<MultipleChoiceContent> {
  if (value === null) return { state: "draft" };

  const content = parseMultipleChoiceContent(value);
  return content ? { state: "valid", content } : { state: "malformed" };
}
