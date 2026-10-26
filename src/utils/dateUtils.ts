/**
 * Date Utility Module for Invoice Date Handling
 * Supports:
 * - Dynamic leap year and month length validation
 * - Parsing any valid calendar date (past or future, across all years)
 * - Converting human-readable dates (e.g. "21st August 2026") <-> standard ISO format ("2026-08-21")
 * - Formatting with ordinal suffixes ("1st", "2nd", "3rd", "21st", etc.)
 * - Rejection of only genuinely invalid calendar dates (e.g. Feb 29 in non-leap year, Apr 31, etc.)
 * - Never hardcodes 2026 or any specific year
 */

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;

export const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
] as const;

export interface ParsedDateDetails {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
  isoDate: string; // YYYY-MM-DD
}

/**
 * Checks if a given year is a leap year according to the Gregorian calendar.
 * Rule: Divisible by 4, except end-of-century years which must be divisible by 400.
 */
export function isLeapYear(year: number): boolean {
  if (isNaN(year) || year <= 0) return false;
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns the exact number of days in a given month of a given year,
 * correctly accounting for February in leap years.
 * @param year e.g. 2024, 2025, 2026
 * @param month 1-12 (1 = Jan, 12 = Dec)
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

/**
 * Returns ordinal suffix for a day of the month:
 * 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st, 22nd, 23rd, 31st.
 */
export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Resolves month name or abbreviation to 1-based month index (1-12).
 */
export function parseMonthNameToIndex(name: string): number | null {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (MONTH_NAMES[i].toLowerCase() === clean) return i + 1;
    if (MONTH_ABBREVIATIONS[i].toLowerCase() === clean) return i + 1;
  }
  return null;
}

/**
 * Validates whether year, month, day represent a valid calendar date.
 * Rejects only impossible dates (like Feb 30 or Feb 29 in non-leap years, Apr 31, etc.)
 * Does NOT restrict past or future years.
 */
export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) return false;
  return true;
}

/**
 * Parses ANY valid date string or Date object into structured details { year, month, day, isoDate }.
 * Accepts:
 * - YYYY-MM-DD, YYYY/MM/DD
 * - 21st August 2026, 21 August 2026, 21-Aug-2026
 * - August 21, 2026, Aug 21st 2026
 * - DD-MM-YYYY, DD/MM/YYYY
 * - Full ISO timestamp YYYY-MM-DDTHH:mm:ss...
 * Returns null if the date is invalid or impossible.
 */
export function parseDateDetails(input: string | Date | null | undefined): ParsedDateDetails | null {
  if (!input) return null;

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    const year = input.getFullYear();
    const month = input.getMonth() + 1;
    const day = input.getDate();
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, isoDate };
  }

  if (typeof input !== 'string') return null;
  let str = input.trim();
  if (!str) return null;

  // Handle ISO string with time component
  if (str.includes('T')) {
    str = str.split('T')[0];
  }

  // 1. Check YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return {
        year,
        month,
        day,
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    }
    return null;
  }

  // 2. Check "21st August 2026", "21 August 2026", "21-Aug-2026", "21st Aug 2026"
  const dmyTextMatch = str.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s,-]+([A-Za-z]+)[\s,-]+(\d{4})$/i);
  if (dmyTextMatch) {
    const day = parseInt(dmyTextMatch[1], 10);
    const month = parseMonthNameToIndex(dmyTextMatch[2]);
    const year = parseInt(dmyTextMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) {
      return {
        year,
        month,
        day,
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    }
    return null;
  }

  // 3. Check "August 21st, 2026", "August 21 2026", "Aug 21, 2026"
  const mdyTextMatch = str.match(/^([A-Za-z]+)[\s,-]+(\d{1,2})(?:st|nd|rd|th)?(?:,)?[\s,-]+(\d{4})$/i);
  if (mdyTextMatch) {
    const month = parseMonthNameToIndex(mdyTextMatch[1]);
    const day = parseInt(mdyTextMatch[2], 10);
    const year = parseInt(mdyTextMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) {
      return {
        year,
        month,
        day,
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    }
    return null;
  }

  // 4. Check DD-MM-YYYY or DD/MM/YYYY
  const dmyNumMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyNumMatch) {
    const day = parseInt(dmyNumMatch[1], 10);
    const month = parseInt(dmyNumMatch[2], 10);
    const year = parseInt(dmyNumMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return {
        year,
        month,
        day,
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    }
    // Also test MM-DD-YYYY if day <= 12 and month > 12
    if (day <= 12 && month > 12 && isValidCalendarDate(year, day, month)) {
      return {
        year,
        month: day,
        day: month,
        isoDate: `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`
      };
    }
    return null;
  }

  // Fallback: Attempt JS Date parse (e.g. "Aug 21 2026")
  // Strip ordinal suffixes first so new Date() doesn't fail
  const cleanedStr = str.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
  const fallbackDate = new Date(cleanedStr);
  if (!isNaN(fallbackDate.getTime())) {
    const year = fallbackDate.getFullYear();
    const month = fallbackDate.getMonth() + 1;
    const day = fallbackDate.getDate();
    if (isValidCalendarDate(year, month, day)) {
      return {
        year,
        month,
        day,
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    }
  }

  return null;
}

/**
 * Converts any valid date string or Date object to YYYY-MM-DD.
 * Returns null if the date is invalid or impossible.
 */
export function parseDateToISO(input: string | Date | null | undefined): string | null {
  const details = parseDateDetails(input);
  return details ? details.isoDate : null;
}

/**
 * Formats any valid date string or Date object to standard human-readable format:
 * e.g. "21st August 2026"
 * If input cannot be parsed as a date, returns the trimmed original string (or empty string).
 */
export function formatToHumanDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  const details = parseDateDetails(input);
  if (!details) {
    return typeof input === 'string' ? input.trim() : '';
  }
  const { day, month, year } = details;
  const suffix = getOrdinalSuffix(day);
  const monthName = MONTH_NAMES[month - 1];
  return `${day}${suffix} ${monthName} ${year}`;
}

/**
 * Generates today's date in human-readable format, e.g. "26th October 2026"
 */
export function getTodayHumanDate(): string {
  return formatToHumanDate(new Date());
}

/**
 * Generates a future date offset by N days in human-readable format
 */
export function getOffsetHumanDate(daysFromToday: number = 30): string {
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);
  return formatToHumanDate(target);
}
