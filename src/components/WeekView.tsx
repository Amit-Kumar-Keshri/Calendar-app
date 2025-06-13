import React, { useEffect, useState } from "react";
import type { Event } from "../types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft,faAngleRight } from '@fortawesome/free-solid-svg-icons';

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

const formatTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

const hourHeight = 56;

const getEventStart = (event: Event) =>
  event.start.dateTime
    ? new Date(event.start.dateTime)
    : event.start.date
    ? new Date(event.start.date)
    : null;

const getEventEnd = (event: Event) => {
  if (event.end.dateTime) return new Date(event.end.dateTime);
  if (event.end.date) {
    const d = new Date(event.end.date);
    d.setDate(d.getDate() - 1); // Google Calendar all-day end is exclusive
    return d;
  }
  return null;
};

const isMultiDay = (event: Event) => {
  const start = getEventStart(event);
  const end = getEventEnd(event);
  if (!start || !end) return false;
  return (
    (event.end.date && !event.end.dateTime) ||
    end.getDate() !== start.getDate() ||
    end.getMonth() !== start.getMonth() ||
    end.getFullYear() !== start.getFullYear()
  );
};

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
       <div className="head_section">
      {/* Toolbar */}
      <div className="weekview-toolbar">
        <button onClick={handleToday} className="weekview-nav-btn">
          today
        </button>
        <span className="button-arrow">
        <button onClick={navigateToPreviousWeek} className="weekview-nav-btn">
        <FontAwesomeIcon icon={faAngleLeft} />
        </button>
         <button onClick={navigateToNextWeek} className="weekview-nav-btn">
        <FontAwesomeIcon icon={faAngleRight} />
        </button>
        </span>
        
        <h2 className="weekview-title">{formatWeekRange()}</h2>
       
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
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
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
            {/* Multi-day event bars stacked at the top below the date */}
            <div
              style={{
                position: "absolute",
                top: 2,
                left: 0,
                right: 0,
                zIndex: 4,
              }}
            >
              {events
                .filter((event) => {
                  const start = getEventStart(event);
                  const end = getEventEnd(event);
                  if (!start || !end) return false;
                  return isMultiDay(event) && start <= date && date <= end;
                })
                .map((event, idx) => {
                  const start = getEventStart(event)!;
                  const end = getEventEnd(event)!;
                  const weekStart = currentWeek[0];
                  const weekEnd = currentWeek[6];
                  const isFirstDay =
                    date.toDateString() ===
                    (start > weekStart ? start : weekStart).toDateString();
                  const isLastDay =
                    date.toDateString() ===
                    (end < weekEnd ? end : weekEnd).toDateString();
                  return (
                    <div
                      key={event.id}
                      className="weekview-event weekview-event-multiday"
                      style={{
                        position: "relative",
                        top: idx * 26,
                        left: isFirstDay ? 2 : 0,
                        right: isLastDay ? 2 : 0,
                        height: 22,
                        borderTopLeftRadius: isFirstDay ? 2 : 0,
                        borderBottomLeftRadius: isFirstDay ? 2 : 0,
                        borderTopRightRadius: isLastDay ? 2 : 0,
                        borderBottomRightRadius: isLastDay ? 2 : 0,
                        background: "#1a73e8",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: "0.95em",
                        padding: "2px 8px",
                        marginBottom: 2,
                        overflow: "hidden",
                        zIndex: 4,
                      }}
                    >
                      {event.summary}
                    </div>
                  );
                })}
            </div>
            {/* Timed/single-day events */}
            <div
              style={{
                position: "relative",
                zIndex: 3,
                marginTop: (() => {
                  // Count multi-day events for this day to offset single events
                  const multiDayCount = events.filter((event) => {
                    const start = getEventStart(event);
                    const end = getEventEnd(event);
                    if (!start || !end) return false;
                    return isMultiDay(event) && start <= date && date <= end;
                  }).length;
                  return multiDayCount ? multiDayCount * 26 + 2 : 0;
                })(),
              }}
            >
              {events
                .filter((event) => {
                  const eventDate = event.start.dateTime
                    ? new Date(event.start.dateTime)
                    : event.start.date
                    ? new Date(event.start.date)
                    : null;
                  const eventEnd = event.end.dateTime
                    ? new Date(event.end.dateTime)
                    : event.end.date
                    ? new Date(event.end.date)
                    : null;
                  if (!eventDate || !eventEnd) return false;
                  // Only show single-day or timed events
                  if (event.end.date && !event.end.dateTime) {
                    eventEnd.setDate(eventEnd.getDate() - 1);
                  }
                  return (
                    !isMultiDay(event) &&
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
                  const height = Math.max(
                    (endHour - startHour) * hourHeight,
                    28
                  );

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
                      key={event.id+ idx}
                      className="weekview-event"
                      style={{
                        top,
                        left,
                        width,
                        height,
                      }}
                    >
                      <div className="weekview-event-title">
                        {event.summary}
                      </div>
                      <div className="weekview-event-time">
                        {event.startTime ? formatTime(event.startTime) : ""}
                        {event.endTime ? " - " + formatTime(event.endTime) : ""}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
