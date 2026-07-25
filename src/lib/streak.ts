function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Counts consecutive active days walking back from today. If today has no
 * activity yet, counting starts from yesterday so an in-progress day doesn't
 * zero out an otherwise-intact streak.
 */
export function computeStreak(
  dates: string[],
  today: Date = new Date(),
): number {
  const dateSet = new Set(dates);
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  if (!dateSet.has(toDateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (dateSet.has(toDateKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
