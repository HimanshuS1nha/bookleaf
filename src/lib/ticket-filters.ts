// Keeps only values from `allowed`, dropping anything hand-edited into the URL
export const pickAllowed = <T extends string>(
  values: string[],
  allowed: readonly T[],
) => values.filter((value): value is T => allowed.includes(value as T));

// Converts a yyyy-mm-dd from a date input into an instant in the viewer's timezone
export const toLocalIso = (date: string, time: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const parsePage = (value: string | null) =>
  Math.max(1, Number(value) || 1);
