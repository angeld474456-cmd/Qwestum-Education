export const SEQUENCE_MIN_ITEMS = 3;
export const SEQUENCE_MAX_ITEMS = 8;
export const SEQUENCE_ITEM_TEXT_MAX_LENGTH = 1000;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SequenceTaskItem = {
  id: string;
  text: string;
};

export type SequenceTaskContent = {
  items: SequenceTaskItem[];
  correctOrder: string[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const valueKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();

  return (
    valueKeys.length === expectedKeys.length &&
    valueKeys.every((key, index) => key === expectedKeys[index])
  );
}

export function normalizeSequenceItemText(text: string) {
  return text.trim().toLowerCase();
}

export function isValidSequenceTaskContent(
  value: unknown
): value is SequenceTaskContent {
  if (!isPlainObject(value) || !hasExactKeys(value, ["items", "correctOrder"])) {
    return false;
  }

  if (!Array.isArray(value.items) || !Array.isArray(value.correctOrder)) {
    return false;
  }

  if (
    value.items.length < SEQUENCE_MIN_ITEMS ||
    value.items.length > SEQUENCE_MAX_ITEMS ||
    value.correctOrder.length !== value.items.length
  ) {
    return false;
  }

  const items: SequenceTaskItem[] = [];

  for (const valueItem of value.items) {
    if (!isPlainObject(valueItem) || !hasExactKeys(valueItem, ["id", "text"])) {
      return false;
    }

    if (
      typeof valueItem.id !== "string" ||
      !uuidPattern.test(valueItem.id) ||
      typeof valueItem.text !== "string" ||
      !valueItem.text.trim() ||
      Array.from(valueItem.text).length > SEQUENCE_ITEM_TEXT_MAX_LENGTH
    ) {
      return false;
    }

    items.push({ id: valueItem.id, text: valueItem.text });
  }

  const itemIds = items.map((item) => item.id);
  const normalizedTexts = items.map((item) => normalizeSequenceItemText(item.text));

  if (
    new Set(itemIds).size !== itemIds.length ||
    new Set(normalizedTexts).size !== normalizedTexts.length ||
    value.correctOrder.some(
      (itemId) => typeof itemId !== "string" || !uuidPattern.test(itemId)
    )
  ) {
    return false;
  }

  return (
    new Set(value.correctOrder).size === value.correctOrder.length &&
    value.correctOrder.every((itemId) => itemIds.includes(itemId))
  );
}

export function parseSequenceTaskContent(
  value: unknown
): SequenceTaskContent | null {
  if (!isValidSequenceTaskContent(value)) return null;

  const itemById = new Map(value.items.map((item) => [item.id, item]));
  const orderedItems = value.correctOrder.map((itemId) => itemById.get(itemId));

  if (orderedItems.some((item) => !item)) return null;

  return {
    items: orderedItems as SequenceTaskItem[],
    correctOrder: [...value.correctOrder],
  };
}

export function serializeSequenceTaskContent(
  items: SequenceTaskItem[]
): SequenceTaskContent | null {
  const content = {
    items: items.map((item) => ({ id: item.id, text: item.text })),
    correctOrder: items.map((item) => item.id),
  };

  return isValidSequenceTaskContent(content) ? content : null;
}

export function getSequenceValidationMessages(items: SequenceTaskItem[]) {
  const messages: string[] = [];

  if (items.length < SEQUENCE_MIN_ITEMS || items.length > SEQUENCE_MAX_ITEMS) {
    messages.push("Добавьте от 3 до 8 элементов.");
  }

  if (items.some((item) => !item.text.trim())) {
    messages.push("Заполните текст каждого элемента.");
  }

  if (
    items.some(
      (item) => Array.from(item.text).length > SEQUENCE_ITEM_TEXT_MAX_LENGTH
    )
  ) {
    messages.push("Текст элемента не должен превышать 1000 символов.");
  }

  const normalizedTexts = items.map((item) => normalizeSequenceItemText(item.text));
  if (new Set(normalizedTexts).size !== normalizedTexts.length) {
    messages.push("Элементы не должны повторяться.");
  }

  if (new Set(items.map((item) => item.id)).size !== items.length) {
    messages.push("Идентификаторы элементов должны быть уникальными.");
  }

  return messages;
}

export function moveSequenceItem(
  items: SequenceTaskItem[],
  index: number,
  direction: -1 | 1
) {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;

  const nextItems = [...items];
  [nextItems[index], nextItems[destination]] = [
    nextItems[destination],
    nextItems[index],
  ];
  return nextItems;
}

function stableHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getTeacherSequencePreviewOrder(
  taskId: string,
  items: SequenceTaskItem[],
  canonicalOrder: string[]
) {
  const ids = [...items]
    .sort((left, right) => {
      const difference =
        stableHash(`${taskId}:${left.id}`) -
        stableHash(`${taskId}:${right.id}`);
      return difference || left.id.localeCompare(right.id);
    })
    .map((item) => item.id);

  if (
    ids.length > 1 &&
    ids.every((itemId, index) => itemId === canonicalOrder[index])
  ) {
    return [...ids.slice(1), ids[0]];
  }

  return ids;
}
