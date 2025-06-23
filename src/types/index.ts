// Core calendar types with improved type safety and consistency

export interface GoogleCalendarDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
}

export interface Event {
  id: string;
  summary: string;
  description?: string;
  start: GoogleCalendarDateTime;
  end: GoogleCalendarDateTime;
  location?: string;
  attendees?: CalendarAttendee[];
  // Computed fields for internal use
  convertedStart?: Date | null;
  convertedEnd?: Date | null;
}

export interface CalendarViewProps {
  events: Event[];
  onEventSelect?: (event: Event) => void;
}

export interface WeekViewProps extends CalendarViewProps {
  onSwitchView: (view: "month" | "week") => void;
}

export interface MonthViewProps extends CalendarViewProps {
  onSwitchView: (view: "month" | "week") => void;
}

// Configuration types
export interface CalendarConfig {
  timezone: string;
  timeFormat: "12h" | "24h";
  startHour: number;
  endHour: number;
  hourHeight: number;
}

// Utility types for better type safety
export type CalendarView = "month" | "week";
export type TimeFormat = "12h" | "24h";

// Day information interface
export interface CalendarDay {
  day: string;
  date: number;
  fullDate: Date;
  isToday: boolean;
  isActive: boolean;
  isPadding?: boolean;
  hasBreak?: boolean;
}

// Event positioning for week view
export interface EventPosition {
  event: Event;
  top: number;
  height: number;
  startTime: Date;
  endTime: Date;
  isMultiDay: boolean;
}
