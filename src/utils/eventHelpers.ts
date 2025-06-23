// Event-related utility functions
import type { Event } from "../types";
import { APP_TIMEZONE } from "./constants";
import { convertToTimezone } from "./dateTime";

/**
 * Safely extracts the start date/time from an event
 */
export const getEventStart = (event: Event): Date | null => {
  try {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime);
    }
    if (event.start.date) {
      return new Date(event.start.date);
    }
    return null;
  } catch (error) {
    console.warn("Failed to parse event start time:", error);
    return null;
  }
};

/**
 * Safely extracts the end date/time from an event
 */
export const getEventEnd = (event: Event): Date | null => {
  try {
    if (event.end.dateTime) {
      return new Date(event.end.dateTime);
    }
    if (event.end.date) {
      const date = new Date(event.end.date);
      // Google Calendar all-day events have exclusive end dates
      date.setDate(date.getDate() - 1);
      return date;
    }
    return null;
  } catch (error) {
    console.warn("Failed to parse event end time:", error);
    return null;
  }
};

/**
 * Determines if an event spans multiple days
 */
export const isMultiDay = (event: Event): boolean => {
  const start = getEventStart(event);
  const end = getEventEnd(event);

  if (!start || !end) return false;

  // All-day event (date only, not dateTime)
  if (event.end.date && !event.end.dateTime) return true;

  // Timed event: check if it spans more than 24 hours or crosses midnight
  const durationMs = end.getTime() - start.getTime();
  const spans24Hours = durationMs >= 24 * 60 * 60 * 1000;
  const crossesMidnight =
    start.getDate() !== end.getDate() ||
    start.getMonth() !== end.getMonth() ||
    start.getFullYear() !== end.getFullYear();

  return spans24Hours || crossesMidnight;
};

/**
 * Converts an event to use timezone-aware dates
 */
export const convertEventToTimezone = (
  event: Event,
  timezone: string = APP_TIMEZONE
): Event => {
  let convertedStart: Date | null = null;
  let convertedEnd: Date | null = null;

  try {
    if (event.start.dateTime) {
      convertedStart = convertToTimezone(
        new Date(event.start.dateTime),
        timezone
      );
    } else if (event.start.date) {
      convertedStart = new Date(event.start.date);
    }

    if (event.end.dateTime) {
      convertedEnd = convertToTimezone(new Date(event.end.dateTime), timezone);
    } else if (event.end.date) {
      const date = new Date(event.end.date);
      date.setDate(date.getDate() - 1); // Adjust for exclusive end date
      convertedEnd = date;
    }
  } catch (error) {
    console.warn("Failed to convert event to timezone:", error);
  }

  return {
    ...event,
    convertedStart,
    convertedEnd,
  };
};

/**
 * Formats event time for display
 */
export const formatEventTime = (
  dateStr: string | undefined,
  format: "12h" | "24h" = "12h",
  timezone: string = APP_TIMEZONE
): string => {
  if (!dateStr) return "";

  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: format === "12h",
      timeZone: timezone,
    };

    return date.toLocaleTimeString("en-US", options);
  } catch (error) {
    console.warn("Failed to format event time:", error);
    return "";
  }
};

/**
 * Gets the duration of an event in minutes
 */
export const getEventDuration = (event: Event): number => {
  const start = getEventStart(event);
  const end = getEventEnd(event);

  if (!start || !end) return 0;

  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Checks if an event occurs on a specific date
 */
export const eventOccursOnDate = (
  event: Event,
  date: Date,
  timezone: string = APP_TIMEZONE
): boolean => {
  const start = getEventStart(event);
  const end = getEventEnd(event);

  if (!start || !end) return false;

  // Convert event times to the specified timezone
  const convertedStart = convertToTimezone(start, timezone);
  const convertedEnd = convertToTimezone(end, timezone);

  // Check if the date falls within the event's time range
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dateEnd = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );

  return convertedStart < dateEnd && convertedEnd >= dateStart;
};

/**
 * Sorts events by start time
 */
export const sortEventsByStartTime = (events: Event[]): Event[] => {
  return [...events].sort((a, b) => {
    const startA = getEventStart(a);
    const startB = getEventStart(b);

    if (!startA || !startB) return 0;

    return startA.getTime() - startB.getTime();
  });
};

/**
 * Gets events for a specific date range
 */
export const getEventsInDateRange = (
  events: Event[],
  startDate: Date,
  endDate: Date,
  timezone: string = APP_TIMEZONE
): Event[] => {
  return events.filter((event) => {
    const eventStart = getEventStart(event);
    const eventEnd = getEventEnd(event);

    if (!eventStart || !eventEnd) return false;

    const convertedStart = convertToTimezone(eventStart, timezone);
    const convertedEnd = convertToTimezone(eventEnd, timezone);

    // Event overlaps with date range if:
    // - Event starts before range ends AND
    // - Event ends after range starts
    return convertedStart < endDate && convertedEnd >= startDate;
  });
};
