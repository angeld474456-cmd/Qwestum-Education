export type ChoiceOption = { id: string; text: string };
export type MultipleChoiceContent = {
  options: ChoiceOption[];
  correctOptionIds: string[];
};

const MAX_OPTIONS = 100;
const MAX_OPTION_ID_LENGTH = 128;
const MAX_OPTION_TEXT_LENGTH = 4000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonBlankString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && /\S/.test(value) && value.length <= maxLength;
}

export function parseMultipleChoiceContent(value: unknown): MultipleChoiceContent | null {
  if (!isPlainObject(value) || !Array.isArray(value.options) || !Array.isArray(value.correctOptionIds)) {
    return null;
  }

  if (value.options.length < 2 || value.options.length > MAX_OPTIONS || value.correctOptionIds.length < 2 || value.correctOptionIds.length > MAX_OPTIONS) {
    return null;
  }

  const optionIds = new Set<string>();
  const options: ChoiceOption[] = [];

  for (const option of value.options) {
    if (!isPlainObject(option) || !isNonBlankString(option.id, MAX_OPTION_ID_LENGTH) || !isNonBlankString(option.text, MAX_OPTION_TEXT_LENGTH) || optionIds.has(option.id)) {
      return null;
    }
    optionIds.add(option.id);
    options.push({ id: option.id, text: option.text });
  }

  const correctOptionIds = new Set<string>();
  for (const optionId of value.correctOptionIds) {
    if (!isNonBlankString(optionId, MAX_OPTION_ID_LENGTH) || !optionIds.has(optionId) || correctOptionIds.has(optionId)) {
      return null;
    }
    correctOptionIds.add(optionId);
  }

  return { options, correctOptionIds: [...correctOptionIds] };
}

export function haveSameOptionIds(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}
