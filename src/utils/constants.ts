// Application-wide constants and configuration

// Timezone configuration
export const APP_TIMEZONE = "America/New_York";

// Time format options
export const TIME_FORMATS = {
  TWELVE_HOUR: "12h" as const,
  TWENTY_FOUR_HOUR: "24h" as const,
} as const;

// Calendar view constants
export const CALENDAR_VIEWS = {
  WEEK: "week" as const,
  MONTH: "month" as const,
} as const;

// Week view configuration
export const WEEK_VIEW_CONFIG = {
  HOUR_HEIGHT: 56,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DEFAULT_START_HOUR: 6, // Start displaying from 6 AM
  SCROLL_HEADER_HEIGHT: 60,
  SCROLL_SPACER_HEIGHT: 30,
  GRID_SCROLL_DELAY: 100, // Delay before scrolling to start hour
} as const;

// Month view configuration
export const MONTH_VIEW_CONFIG = {
  DAYS_PER_WEEK: 7,
  MAX_VISIBLE_EVENTS: 3, // Maximum events to show before "more" indicator
} as const;

// API configuration
export const API_CONFIG = {
  MAX_RESULTS: 2500,
  ORDER_BY: "startTime",
  SINGLE_EVENTS: true,
} as const;

// Performance configuration
export const PERFORMANCE_CONFIG = {
  CACHE_SIZE_LIMIT: 1000,
  DEBOUNCE_DELAY: 300,
  RESIZE_DEBOUNCE: 150,
} as const;

// Event styling
export const EVENT_STYLES = {
  MIN_HEIGHT: 20,
  BORDER_RADIUS: 4,
  PADDING: 2,
} as const;

// Tooltip configuration
export const TOOLTIP_CONFIG = {
  SHOW_DELAY: 500,
  HIDE_DELAY: 100,
  OFFSET_X: 10,
  OFFSET_Y: 10,
} as const;

// Date format patterns
export const DATE_FORMATS = {
  MONTH_NAMES: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  WEEKDAY_SHORT: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FAILED_TO_FETCH_EVENTS: "Failed to fetch calendar events",
  INVALID_DATE: "Invalid date provided",
  MISSING_API_KEY: "Google Calendar API key is missing",
  MISSING_CALENDAR_ID: "Google Calendar ID is missing",
  TIMEZONE_CONVERSION_FAILED: "Failed to convert timezone",
} as const;
