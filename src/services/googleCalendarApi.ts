import axios, { type AxiosResponse } from "axios";
import type { Event } from "../types";
import { API_CONFIG, ERROR_MESSAGES } from "../utils/constants";

// Use environment variables for sensitive data
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID as string;

// Validate required environment variables
const validateEnvironment = (): void => {
  if (!API_KEY) {
    throw new Error(ERROR_MESSAGES.MISSING_API_KEY);
  }
  if (!CALENDAR_ID) {
    throw new Error(ERROR_MESSAGES.MISSING_CALENDAR_ID);
  }
};

// Google Calendar API response interface
interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Transforms Google Calendar API event to our internal Event type
 */
const transformGoogleEvent = (item: GoogleCalendarEvent): Event => {
  return {
    id: item.id,
    summary: item.summary || "Untitled Event",
    description: item.description,
    start: {
      dateTime: item.start.dateTime,
      date: item.start.date,
      timeZone: item.start.timeZone,
    },
    end: {
      dateTime: item.end.dateTime,
      date: item.end.date,
      timeZone: item.end.timeZone,
    },
    location: item.location,
    attendees: item.attendees?.map((attendee) => ({
      email: attendee.email,
      displayName: attendee.displayName,
      responseStatus: attendee.responseStatus as
        | "needsAction"
        | "declined"
        | "tentative"
        | "accepted",
    })),
  };
};

/**
 * Fetches events from Google Calendar API
 */
export const fetchEvents = async (
  timeMin?: string,
  timeMax?: string,
  maxResults: number = API_CONFIG.MAX_RESULTS
): Promise<Event[]> => {
  try {
    // Validate environment variables
    validateEnvironment();

    // Build API parameters
    const params: Record<string, string | number | boolean> = {
      key: API_KEY,
      singleEvents: API_CONFIG.SINGLE_EVENTS,
      orderBy: API_CONFIG.ORDER_BY,
      maxResults,
    };

    // Add optional time range parameters
    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    // Remove undefined parameters
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    // Construct the correct URL
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      CALENDAR_ID
    )}/events`;

    const response: AxiosResponse<GoogleCalendarResponse> = await axios.get(
      url,
      {
        params,
        timeout: 10000, // 10 second timeout
      }
    );

    // Handle API errors
    if (response.data.error) {
      throw new Error(
        `Google Calendar API Error: ${response.data.error.message}`
      );
    }

    // Transform and return events
    const events = response.data.items || [];
    return events.map(transformGoogleEvent);
  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(
          "Google Calendar API Error:",
          error.response.status,
          error.response.data
        );
        throw new Error(
          `${ERROR_MESSAGES.FAILED_TO_FETCH_EVENTS}: ${error.response.status}`
        );
      } else if (error.request) {
        console.error("Network Error:", error.message);
        throw new Error(
          `${ERROR_MESSAGES.FAILED_TO_FETCH_EVENTS}: Network error`
        );
      }
    }

    console.error("Unexpected error fetching events:", error);
    throw new Error(ERROR_MESSAGES.FAILED_TO_FETCH_EVENTS);
  }
};

/**
 * Fetches events for a specific date range
 */
export const fetchEventsInRange = async (
  startDate: Date,
  endDate: Date,
  maxResults?: number
): Promise<Event[]> => {
  const timeMin = startDate.toISOString();
  const timeMax = endDate.toISOString();

  return fetchEvents(timeMin, timeMax, maxResults);
};

/**
 * Fetches events for the current month
 */
export const fetchCurrentMonthEvents = async (): Promise<Event[]> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return fetchEventsInRange(startOfMonth, endOfMonth);
};
