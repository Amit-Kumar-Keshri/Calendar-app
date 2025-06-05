import React from "react";
import type { Event } from "../types";

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
              <h3>{event.title}</h3>
              {/* Show start and end time below the event name */}
              <div>
                {event.startTime
                  ? new Date(event.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
                {event.endTime
                  ? " - " +
                    new Date(event.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </div>
              <p>
                {event.startDate} - {event.endDate}
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
