import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Event } from "../types";
import {
  getMonthDays,
  APP_TIMEZONE,
  getCurrentDateInTimezone,
  convertToTimezone,
} from "../utils/dateTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";

interface MonthViewProps {
  events: Event[];
  onSwitchView: (view: "month" | "week") => void;
}

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

const getMonthName = (date: Date) => {
  const months = [
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
  ];
  return months[date.getMonth()];
};

const MonthView: React.FC<MonthViewProps> = ({ events, onSwitchView }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(
    getCurrentDateInTimezone()
  );
  const [currentDate, setCurrentDate] = useState<Date>(
    getCurrentDateInTimezone()
  );
  const [popupIdx, setPopupIdx] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // Track expanded event per cell: { [cellIdx]: eventIdx }
  const [expandedEvent, setExpandedEvent] = useState<{
    [cellIdx: number]: number | null;
  }>({});

  const [hoveredEvent, setHoveredEvent] = useState<{
    event: Event;
    x: number;
    y: number;
  } | null>(null);

  // Memoize timezone-converted events to avoid repeated conversions
  const convertedEvents = useMemo(() => {
    return events.map((event) => {
      let convertedStart = null;
      let convertedEnd = null;

      if (event.start.dateTime) {
        convertedStart = convertToTimezone(new Date(event.start.dateTime));
      } else if (event.start.date) {
        convertedStart = new Date(event.start.date);
      }

      if (event.end.dateTime) {
        convertedEnd = convertToTimezone(new Date(event.end.dateTime));
      } else if (event.end.date) {
        const d = new Date(event.end.date);
        d.setDate(d.getDate() - 1);
        convertedEnd = d;
      }

      return {
        ...event,
        convertedStart,
        convertedEnd,
      };
    });
  }, [events]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const monthDays = useMemo(
    () => getMonthDays({ currentDate, selectedDate }),
    [currentDate, selectedDate]
  );

  const handlePreviousMonth = useCallback(() => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
    setSelectedDate(prevMonth);
  }, [currentDate]);

  const handleNextMonth = useCallback(() => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
    setSelectedDate(nextMonth);
  }, [currentDate]);

  const handleToday = useCallback(() => {
    const today = getCurrentDateInTimezone();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  const totalEventsinDay = useCallback(
    (date: Date) => {
      return convertedEvents.filter((event) => {
        if (!event.convertedStart || !event.convertedEnd) return false;
        return event.convertedStart <= date && date <= event.convertedEnd;
      });
    },
    [convertedEvents]
  );

  const handleEventHover = useCallback((event: Event, e: React.MouseEvent) => {
    setHoveredEvent({
      event,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  const handleEventLeave = useCallback(() => {
    setHoveredEvent(null);
  }, []);

  const formatTime = useCallback(
    (dateString: string, format: "12h" | "24h") => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (format === "12h") {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: APP_TIMEZONE,
        });
      } else {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: APP_TIMEZONE,
        });
      }
    },
    []
  );

  return (
    <div className="monthview-container">
      <div className="head_section">
        <div className="monthview-toolbar">
          <button onClick={handleToday} className="monthview-nav-btn">
            today
          </button>
          <h2 className="monthview-title">
            {getMonthName(currentDate)} {currentDate.getFullYear()}{" "}
          </h2>
          <span className="button-arrow">
            <button onClick={handlePreviousMonth} className="monthview-nav-btn">
              <FontAwesomeIcon icon={faAngleLeft} />
            </button>
            <button onClick={handleNextMonth} className="monthview-nav-btn">
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
          </span>
        </div>
        <div className="monthview-switch">
          <button
            className="monthview-switch-btn monthview-switch-week"
            onClick={() => onSwitchView("week")}
          >
            week
          </button>
          <button className="monthview-switch-btn monthview-switch-month">
            month
          </button>
        </div>
      </div>
      <div className="monthview-table">
        <div>
          <div className="tr">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div className="th" key={i}>
                {d}
              </div>
            ))}
          </div>
          <div className="monthview-body">
            {monthDays.map((day, idx) => {
              // Separate all-day/multi-day events and timed (hourly) events
              const allEvents = totalEventsinDay(day.fullDate);

              // Timed events: those with start.dateTime (not all-day)
              const timedEvents = convertedEvents.filter((event) => {
                if (!event.convertedStart || !event.start.dateTime)
                  return false;

                return (
                  event.convertedStart.getFullYear() ===
                    day.fullDate.getFullYear() &&
                  event.convertedStart.getMonth() === day.fullDate.getMonth() &&
                  event.convertedStart.getDate() === day.fullDate.getDate()
                );
              });
              const allDayEvents = allEvents.filter(
                (event) => !event.start.dateTime || isMultiDay(event)
              );
              const dayEvents = [...allDayEvents, ...timedEvents];

              const showPopup = popupIdx === idx;
              // Determine if this day is in the current month
              const isCurrentMonth =
                day.fullDate.getMonth() === currentDate.getMonth() &&
                day.fullDate.getFullYear() === currentDate.getFullYear();
              // Use isToday from getMonthDays
              const isToday = day.isToday;
              return (
                <div
                  className={
                    "monthview-td" +
                    (isCurrentMonth ? "" : " monthview-other-month")
                  }
                  key={idx}
                >
                  <div className={"monthview-date-wrapper"}>
                    <div
                      className={
                        "monthview-date" + (isToday ? " monthview-today" : "")
                      }
                    >
                      {day.date}
                    </div>
                  </div>
                  {/* Show up to 3 events (all-day/multi-day first, then timed) */}
                  <div className="single-day-event-cover">
                    {windowWidth < 640
                      ? dayEvents.length > 0 && (
                          <div
                            className="event-dot"
                            onClick={() => setPopupIdx(idx)}
                            style={{
                              cursor: "pointer",
                              display: "inline-block",
                            }}
                          >
                            ●
                          </div>
                        )
                      : dayEvents.slice(0, 3).map((event, i) => {
                          const isExpanded = expandedEvent[idx] === i;
                          const title =
                            event.summary || event.title || `Event ${i + 1}`;
                          const isExpandable = title.length > 40;
                          return (
                            <div
                              className="single-day-event"
                              key={event.id || i}
                              onMouseEnter={(e) => handleEventHover(event, e)}
                              onMouseLeave={handleEventLeave}
                            >
                              {event.start.dateTime && (
                                <span className="mr-1">
                                  {formatTime(event.start.dateTime, "12h")}
                                </span>
                              )}
                              <span
                                className={
                                  (isExpanded
                                    ? "single-day-event-title expanded"
                                    : "single-day-event-title") +
                                  (isExpandable ? " expandable" : "")
                                }
                                onClick={
                                  isExpandable
                                    ? () =>
                                        setExpandedEvent({
                                          ...expandedEvent,
                                          [idx]: isExpanded ? null : i,
                                        })
                                    : undefined
                                }
                                style={
                                  isExpandable ? { cursor: "pointer" } : {}
                                }
                              >
                                {title}
                              </span>
                            </div>
                          );
                        })}

                    {/* Show "+N more" if more than 3 events */}
                    {dayEvents.length > 3 && (
                      <div
                        className="monthview-more-link"
                        onClick={() => setPopupIdx(idx)}
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                  {/* Popup for all events */}
                  {showPopup && (
                    <div className="monthview-popup">
                      <button
                        className="popup-close"
                        onClick={() => setPopupIdx(null)}
                        title="Close"
                      >
                        ×
                      </button>
                      <div className="popup-title">
                        {day.fullDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: APP_TIMEZONE,
                        })}
                      </div>
                      {dayEvents.map((event, i) => (
                        <div
                          className="popup-event"
                          key={event.id || i}
                          onMouseEnter={(e) => handleEventHover(event, e)}
                          onMouseLeave={handleEventLeave}
                        >
                          {event.start.dateTime && (
                            <span className="mr-1">
                              {formatTime(event.start.dateTime, "12h")}
                            </span>
                          )}
                          {event.summary || event.title || `Event ${i + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Hover Tooltip */}
      {hoveredEvent && (
        <div
          className="event-tooltip"
          style={{
            position: "fixed",
            left: hoveredEvent.x + 10,
            top: hoveredEvent.y - 10,
            background: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            zIndex: 10000,
            maxWidth: "250px",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            {hoveredEvent.event.summary || hoveredEvent.event.title || "Event"}
          </div>
          {hoveredEvent.event.start.dateTime && (
            <div style={{ marginBottom: "2px" }}>
              {formatTime(hoveredEvent.event.start.dateTime, "12h")}
              {hoveredEvent.event.end.dateTime &&
                ` - ${formatTime(hoveredEvent.event.end.dateTime, "12h")}`}
            </div>
          )}
          {hoveredEvent.event.description && (
            <div style={{ fontSize: "11px", opacity: 0.9 }}>
              {hoveredEvent.event.description}
            </div>
          )}
          {hoveredEvent.event.location && (
            <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
              📍 {hoveredEvent.event.location}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default MonthView;
