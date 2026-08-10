export const POINTS_VALIDATION_MESSAGE =
  "Баллы должны быть целым числом не меньше 1.";

export function parsePositiveSafeInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const points = Number(value);

  return Number.isSafeInteger(points) && points >= 1 ? points : null;
}
