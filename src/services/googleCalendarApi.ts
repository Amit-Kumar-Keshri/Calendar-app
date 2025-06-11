import axios from "axios";
import type { Event } from "../types";

// Use environment variables for sensitive data
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID as string;

export const fetchEvents = async (
  // timeMin?: string,
  // timeMax?: string
): Promise<Event[]> => {
  const params: any = {
    key: API_KEY,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
    // timeMin: timeMin || new Date().toISOString(),
    // timeMax: timeMax,
  };

  Object.keys(params).forEach(
    (key) => params[key] === undefined && delete params[key]
  );

  const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`;

  const response = await axios.get(url, { params });

  return (
    response.data.items?.map((item: any) => ({
      id: item.id,
      summary: item.summary,
      description: item.description,
      start: item.start,
      end: item.end,
      location: item.location,
      attendees: item.attendees,
      startTime: item.start?.dateTime || item.start?.date || null,
      endTime: item.end?.dateTime || item.end?.date || null,
    })) || []
  );
};
