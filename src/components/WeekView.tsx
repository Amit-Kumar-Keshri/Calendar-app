import React, { useEffect, useState } from "react";
import type { Event } from "../types";

interface WeekViewProps {
  events: Event[];
  onSwitchView: (view: "month" | "week") => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getTimeLabel = (hour: number) => {
  const ampm = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${ampm}`;
};

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  return new Date(d.setDate(diff));
};

const generateWeekArray = (monday: Date) => {
  const week = [];
  for (let i = 0; i < 7; i++) {
    week.push(
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    );
  }
  return week;
};

const isToday = (date: Date) => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const hourHeight = 56;

const WeekView: React.FC<WeekViewProps> = ({ events, onSwitchView }) => {
  const [currentMonday, setCurrentMonday] = useState<Date>(
    getMonday(new Date())
  );
  const [currentWeek, setCurrentWeek] = useState<Date[]>(
    generateWeekArray(getMonday(new Date()))
  );

  useEffect(() => {
    setCurrentWeek(generateWeekArray(currentMonday));
  }, [currentMonday]);

  const navigateToNextWeek = () => {
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    setCurrentMonday(nextMonday);
  };

  const navigateToPreviousWeek = () => {
    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    setCurrentMonday(prevMonday);
  };

  const handleToday = () => {
    const todayMonday = getMonday(new Date());
    setCurrentMonday(todayMonday);
  };

  const formatWeekRange = () => {
    if (currentWeek.length === 0) return "";
    const start = currentWeek[0];
    const end = currentWeek[6];
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString(
        undefined,
        options
      )} - ${end.getDate()}, ${end.toLocaleString("default", {
        month: "short",
      })} ${end.getFullYear()}`;
    }
    return `${start.toLocaleDateString(
      undefined,
      options
    )} - ${end.toLocaleDateString(undefined, options)}, ${end.getFullYear()}`;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="weekview-toolbar">
        <button onClick={navigateToPreviousWeek} className="weekview-nav-btn">
          {"<"}
        </button>
        <button onClick={handleToday} className="weekview-nav-btn">
          today
        </button>
        <h2 className="weekview-title">{formatWeekRange()}</h2>
        <button onClick={navigateToNextWeek} className="weekview-nav-btn">
          {">"}
        </button>
      </div>
      {/* Switch buttons */}
      <div className="weekview-switch">
        <button
          className="weekview-switch-btn weekview-switch-month"
          onClick={() => onSwitchView("month")}
        >
          month
        </button>
        <button className="weekview-switch-btn weekview-switch-week" disabled>
          week
        </button>
      </div>
      {/* Week View Grid */}
      <div
        className="weekview-grid"
        style={{
          gridTemplateRows: `32px repeat(24, ${hourHeight}px)`,
        }}
      >
        {/* Weekday header row */}
        <div className="weekview-header-empty" />
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <div key={d} className="weekview-header-cell">
            {d}
          </div>
        ))}
        {/* Time column (hours) */}
        {HOURS.map((h) => (
          <div key={h} className="weekview-time-cell">
            <span>{getTimeLabel(h)}</span>
          </div>
        ))}
        {/* Day columns (hour cells + events) */}
        {currentWeek.map((date, dayIdx) => (
          <div
            key={dayIdx}
            className={`weekview-day-col${
              dayIdx === 6 ? " weekview-day-col-last" : ""
            }`}
            style={{
              gridColumn: `${dayIdx + 2} / ${dayIdx + 3}`,
              gridRow: `2 / span 24`,
              minHeight: hourHeight * 24,
            }}
          >
            {/* Hour cell borders */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="weekview-hour-border"
                style={{ top: h * hourHeight, height: hourHeight }}
              />
            ))}
            {/* Overlapping events */}
            {events
              .filter((event) => {
                const eventDate = event.start.dateTime
                  ? new Date(event.start.dateTime)
                  : event.start.date
                  ? new Date(event.start.date)
                  : null;
                return (
                  eventDate &&
                  eventDate.getFullYear() === date.getFullYear() &&
                  eventDate.getMonth() === date.getMonth() &&
                  eventDate.getDate() === date.getDate()
                );
              })
              .map((event, idx, arr) => {
                const start = event.startTime
                  ? new Date(event.startTime)
                  : null;
                const end = event.endTime ? new Date(event.endTime) : null;
                if (!start || !end) return null;
                const startHour = start.getHours() + start.getMinutes() / 60;
                const endHour = end.getHours() + end.getMinutes() / 60;
                const top = startHour * hourHeight;
                const height = Math.max((endHour - startHour) * hourHeight, 28);

                // Find overlapping events for this day
                const overlapping = arr.filter((e) => {
                  if (e === event) return false;
                  const s = e.startTime ? new Date(e.startTime) : null;
                  const en = e.endTime ? new Date(e.endTime) : null;
                  if (!s || !en) return false;
                  const sHour = s.getHours() + s.getMinutes() / 60;
                  const enHour = en.getHours() + en.getMinutes() / 60;
                  return startHour < enHour && endHour > sHour;
                });
                const overlapCount = overlapping.length + 1;
                const eventIdx = overlapping.findIndex(
                  (e) => e.id === event.id
                );
                const width = `calc(${100 / overlapCount}% - 4px)`;
                const left = `${
                  (eventIdx === -1 ? 0 : eventIdx) * (100 / overlapCount)
                }%`;

                return (
                  <div
                    key={event.id}
                    className="weekview-event"
                    style={{
                      top,
                      left,
                      width,
                      height,
                    }}
                  >
                    <div className="weekview-event-title">{event.summary}</div>
                    <div className="weekview-event-time">
                      {start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {end
                        ? " - " +
                          end.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
