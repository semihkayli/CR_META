/**
 * Calculates the start date of a Clash Royale season.
 * Seasons start on the first Monday of each month at 09:00 UTC.
 */
export function getSeasonStart(year: number, month: number): Date {
  // month is 0-indexed (0 = January)
  const firstDay = new Date(Date.UTC(year, month, 1, 9, 0, 0));
  const dayOfWeek = firstDay.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  return new Date(Date.UTC(year, month, 1 + daysUntilMonday, 9, 0, 0));
}

/**
 * Gets the current season's start and end dates.
 */
export function getCurrentSeasonBounds(): { start: Date; end: Date; seasonId: string } {
  const now = new Date();
  const currentStart = getSeasonStart(now.getUTCFullYear(), now.getUTCMonth());

  // If we're before the first Monday of this month, we're in previous month's season
  if (now < currentStart) {
    const prevMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
    const prevYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
    const start = getSeasonStart(prevYear, prevMonth);
    return {
      start,
      end: currentStart,
      seasonId: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`
    };
  }

  // Calculate next season start
  const nextMonth = now.getUTCMonth() === 11 ? 0 : now.getUTCMonth() + 1;
  const nextYear = now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  const end = getSeasonStart(nextYear, nextMonth);

  return {
    start: currentStart,
    end,
    seasonId: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  };
}

/**
 * Checks if a battle timestamp falls within the current season.
 */
export function isBattleInCurrentSeason(battleTime: string): boolean {
  const { start, end } = getCurrentSeasonBounds();
  // Clash Royale battleTime format: "20260604T120000.000Z"
  const battleDate = parseBattleTime(battleTime);
  return battleDate >= start && battleDate < end;
}

/**
 * Parses Clash Royale battle time format to a Date object.
 * Format: "20260604T120000.000Z" or "20260604T120000"
 */
export function parseBattleTime(battleTime: string): Date {
  // Format: YYYYMMDDTHHmmss.sssZ
  const cleaned = battleTime.replace(/\./g, '');
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)) - 1;
  const day = parseInt(cleaned.substring(6, 8));
  const hour = parseInt(cleaned.substring(9, 11));
  const minute = parseInt(cleaned.substring(11, 13));
  const second = parseInt(cleaned.substring(13, 15));
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}
