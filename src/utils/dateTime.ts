// Centralized timezone configuration
import { APP_TIMEZONE, PERFORMANCE_CONFIG, ERROR_MESSAGES } from "./constants";

// Cache for timezone conversions to improve performance
const timezoneCache = new Map<string, Date>();

/**
 * Clears the timezone conversion cache
 */
export const clearTimezoneCache = (): void => {
  timezoneCache.clear();
};

/**
 * Helper function to get the current date in the app timezone
 */
export const getCurrentDateInTimezone = (
  timezone: string = APP_TIMEZONE
): Date => {
  try {
    // Create a new date and use Intl.DateTimeFormat to get accurate timezone conversion
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
    const month =
      parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1; // Month is 0-indexed
    const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value || "0"
    );
    const second = parseInt(
      parts.find((p) => p.type === "second")?.value || "0"
    );

    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.warn(ERROR_MESSAGES.TIMEZONE_CONVERSION_FAILED, error);
    return new Date(); // Fallback to local time
  }
};

/**
 * Optimized timezone conversion with caching
 */
export const convertToTimezone = (
  date: Date,
  timezone: string = APP_TIMEZONE
): Date => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn(ERROR_MESSAGES.INVALID_DATE, date);
    return new Date(); // Return current date as fallback
  }

  const cacheKey = `${date.getTime()}-${timezone}`;

  if (timezoneCache.has(cacheKey)) {
    return timezoneCache.get(cacheKey)!;
  }

  try {
    const converted = new Date(
      date.toLocaleString("en-US", { timeZone: timezone })
    );

    // Validate the converted date
    if (isNaN(converted.getTime())) {
      throw new Error("Invalid converted date");
    }

    timezoneCache.set(cacheKey, converted);

    // Limit cache size to prevent memory leaks
    if (timezoneCache.size > PERFORMANCE_CONFIG.CACHE_SIZE_LIMIT) {
      const firstKey = timezoneCache.keys().next().value;
      if (firstKey) {
        timezoneCache.delete(firstKey);
      }
    }

    return converted;
  } catch (error) {
    console.warn(ERROR_MESSAGES.TIMEZONE_CONVERSION_FAILED, error);
    return date; // Return original date as fallback
  }
};

/**
 * Fast timezone conversion for dates (more efficient for date-only comparisons)
 */
export const convertDateToTimezone = (
  date: Date,
  timezone: string = APP_TIMEZONE
): Date => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn(ERROR_MESSAGES.INVALID_DATE, date);
    return new Date();
  }

  // For performance, use UTC offset calculation when possible
  if (timezone === "America/New_York") {
    try {
      const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
      // Approximate EST/EDT offset (this is a simplification)
      const isDST = isDaylightSavingTime(date);
      const offset = isDST ? -4 : -5; // EDT or EST
      return new Date(utcTime + offset * 3600000);
    } catch (error) {
      console.warn("Failed to convert to America/New_York timezone:", error);
    }
  }

  // Fallback to full conversion for other timezones
  return convertToTimezone(date, timezone);
};

/**
 * Helper to determine if date is in daylight saving time (approximate)
 */
const isDaylightSavingTime = (date: Date): boolean => {
  try {
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);
    return (
      date.getTimezoneOffset() <
      Math.max(january.getTimezoneOffset(), july.getTimezoneOffset())
    );
  } catch (error) {
    console.warn("Failed to determine daylight saving time:", error);
    return false;
  }
};

/**
 * Checks if two dates are the same day in the specified timezone
 */
export const isSameDay = (
  date1: Date,
  date2: Date,
  timezone: string = APP_TIMEZONE
): boolean => {
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
    return false;
  }

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return false;
  }

  try {
    // Use optimized conversion for same day comparison
    const d1 = convertDateToTimezone(date1, timezone);
    const d2 = convertDateToTimezone(date2, timezone);

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  } catch (error) {
    console.warn("Failed to compare dates:", error);
    return false;
  }
};

export const getWeekDays = ({
  currentDate,
  selectedDate,
  breakRequest = null,
}: {
  currentDate: Date;
  selectedDate: Date;
  breakRequest?: { startDate: Date; endDate: Date } | null;
}) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(startOfWeek.getDate() + index);
    const hasBreak =
      breakRequest && isSameDay(date, breakRequest.startDate, APP_TIMEZONE);

    return {
      day: date
        .toLocaleString("en-US", { weekday: "short", timeZone: APP_TIMEZONE })
        .toUpperCase(),
      date: date.getDate(),
      fullDate: date,
      isToday: isSameDay(
        date,
        getCurrentDateInTimezone(APP_TIMEZONE),
        APP_TIMEZONE
      ),
      isActive: isSameDay(date, selectedDate, APP_TIMEZONE),
      hasBreak: hasBreak,
    };
  });
};

export const getMonthDays = ({
  currentDate,
  selectedDate,
}: {
  currentDate: Date;
  selectedDate: Date;
  breakRequest?: { startDate: Date; endDate: Date } | null;
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startPadding = firstDayOfMonth.getDay();
  const totalDays = startPadding + lastDayOfMonth.getDate();
  const endPadding = 7 - (totalDays % 7);
  const allDays = [];
  const prevMonth = new Date(year, month, 0);
  const prevMonthLastDay = prevMonth.getDate();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(year, month - 1, prevMonthLastDay - i));
    allDays.push({
      day: date
        .toLocaleString("en-US", { weekday: "short", timeZone: APP_TIMEZONE })
        .toUpperCase(),
      date: date.getDate(),
      fullDate: date,
      isToday: isSameDay(
        date,
        getCurrentDateInTimezone(APP_TIMEZONE),
        APP_TIMEZONE
      ),
      isActive: isSameDay(date, selectedDate, APP_TIMEZONE),
      isPadding: true,
    });
  }

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(Date.UTC(year, month, i));
    allDays.push({
      day: date
        .toLocaleString("en-US", { weekday: "short", timeZone: APP_TIMEZONE })
        .toUpperCase(),
      date: i,
      fullDate: date,
      isToday: isSameDay(
        date,
        getCurrentDateInTimezone(APP_TIMEZONE),
        APP_TIMEZONE
      ),
      isActive: isSameDay(date, selectedDate, APP_TIMEZONE),
      isPadding: false,
    });
  }

  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(Date.UTC(year, month + 1, i));
    allDays.push({
      day: date
        .toLocaleString("en-US", { weekday: "short", timeZone: APP_TIMEZONE })
        .toUpperCase(),
      date: i,
      fullDate: date,
      isToday: isSameDay(
        date,
        getCurrentDateInTimezone(APP_TIMEZONE),
        APP_TIMEZONE
      ),
      isActive: isSameDay(date, selectedDate, APP_TIMEZONE),
      isPadding: true,
    });
  }

  return allDays;
};

// Export the constant for backward compatibility
export { APP_TIMEZONE };
