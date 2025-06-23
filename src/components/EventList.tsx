import React from "react";
import type { Event } from "../types";
import { formatEventTime } from "../utils/eventHelpers";

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  return (
    <div>
      <h2>Event List</h2>
      {events.length === 0 ? (
        <p>No events available.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <h3>{event.summary}</h3>
              {/* Show start and end time below the event name */}
              <div>
                {event.start.dateTime
                  ? formatEventTime(event.start.dateTime)
                  : ""}
                {event.end.dateTime
                  ? " - " + formatEventTime(event.end.dateTime)
                  : ""}
              </div>
              <p>
                {event.start.date || event.start.dateTime} -{" "}
                {event.end.date || event.end.dateTime}
              </p>
              <p>{event.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventList;
