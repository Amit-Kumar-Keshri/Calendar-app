import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import type { Event } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import {
  APP_TIMEZONE,
  getCurrentDateInTimezone,
  isSameDay,
  convertToTimezone,
} from "../utils/dateTime";

interface WeekViewProps {
  events: Event[];
  onSwitchView: (view: "month" | "week") => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getTimeLabel = (hour: number, format: "12h" | "24h") => {
  if (format === "24h") {
    return `${hour.toString().padStart(2, "0")}:00`;
  } else {
    const ampm = hour < 12 ? "AM" : "PM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00${ampm.toLowerCase()}`;
  }
};

const formatTime = (
  dateStr: string | null | undefined,
  format: "12h" | "24h"
) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (format === "24h") {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: APP_TIMEZONE,
    });
  } else {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: APP_TIMEZONE,
    });
  }
};

// Change getMonday to getSunday, so week starts on Sunday - now timezone aware
const getSunday = (date: Date) => {
  // Convert to timezone first
  const d = new Date(date.toLocaleString("en-US", { timeZone: APP_TIMEZONE }));
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

// Update generateWeekArray to use getSunday - now timezone aware
const generateWeekArray = (sunday: Date) => {
  const week = [];
  for (let i = 0; i < 7; i++) {
    week.push(
      new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i)
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
  // All-day event (date only, not dateTime)
  if (event.end.date && !event.end.dateTime) return true;
  // Timed event: check if duration is >= 24 hours
  const durationMs = end.getTime() - start.getTime();
  return durationMs >= 24 * 60 * 60 * 1000;
};

const WeekView: React.FC<WeekViewProps> = ({ events, onSwitchView }) => {
  const [currentSunday, setCurrentSunday] = useState<Date>(
    getSunday(getCurrentDateInTimezone())
  );
  const [currentWeek, setCurrentWeek] = useState<Date[]>(
    generateWeekArray(getSunday(getCurrentDateInTimezone()))
  );
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [popupEvent, setPopupEvent] = useState<{
    dayIdx: number;
    eventId: string | number;
  } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: Event;
    x: number;
    y: number;
  } | null>(null);

  // Ref for the grid container to control scrolling
  const gridContainerRef = useRef<HTMLDivElement>(null);

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

  // Memoize events grouped by day for better performance
  const eventsByDay = useMemo(() => {
    const dayMap = new Map<number, typeof convertedEvents>();

    currentWeek.forEach((date, dayIdx) => {
      const dayEvents = convertedEvents.filter((event) => {
        if (!event.convertedStart || !event.convertedEnd) return false;

        if (isMultiDay(event)) {
          return event.convertedStart <= date && date <= event.convertedEnd;
        } else {
          return (
            event.convertedStart.getFullYear() === date.getFullYear() &&
            event.convertedStart.getMonth() === date.getMonth() &&
            event.convertedStart.getDate() === date.getDate()
          );
        }
      });

      dayMap.set(dayIdx, dayEvents);
    });

    return dayMap;
  }, [convertedEvents, currentWeek]);

  useEffect(() => {
    setCurrentWeek(generateWeekArray(currentSunday));
  }, [currentSunday]);

  // Scroll to 6 AM when component mounts or week changes
  useEffect(() => {
    const scrollTo6AM = () => {
      if (gridContainerRef.current) {
        // Calculate scroll position for 6 AM
        // Grid structure: 60px header + 30px spacer + (6 * hourHeight)
        const scrollTop = 60 + 30 + 6 * hourHeight;
        gridContainerRef.current.scrollTop = scrollTop;
      }
    };

    // Use setTimeout to ensure the DOM is rendered
    const timeoutId = setTimeout(scrollTo6AM, 100);
    return () => clearTimeout(timeoutId);
  }, [currentWeek]); // Trigger when week changes

  // Timer to trigger re-render every minute to update time indicator
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render by updating a dummy state or just rely on the component update
      // The time indicator will use getCurrentDateInTimezone() directly
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close popup on outside click (use 'click' event)
  useEffect(() => {
    if (!popupEvent) return;
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking inside a popup or on a dot
      if (
        (e.target as HTMLElement).closest(".weekview-popup") ||
        (e.target as HTMLElement).closest(".event-dot")
      ) {
        return;
      }
      setPopupEvent(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popupEvent]);

  const navigateToNextWeek = useCallback(() => {
    const nextSunday = new Date(currentSunday);
    nextSunday.setDate(nextSunday.getDate() + 7);
    setCurrentSunday(nextSunday);
  }, [currentSunday]);

  const navigateToPreviousWeek = useCallback(() => {
    const prevSunday = new Date(currentSunday);
    prevSunday.setDate(prevSunday.getDate() - 7);
    setCurrentSunday(prevSunday);
  }, [currentSunday]);

  const handleToday = useCallback(() => {
    const todaySunday = getSunday(getCurrentDateInTimezone());
    setCurrentSunday(todaySunday);
  }, []);

  const formatWeekRange = useCallback(() => {
    if (currentWeek.length === 0) return "";
    const start = currentWeek[0];
    const end = currentWeek[6];
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      timeZone: APP_TIMEZONE,
    };
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString(
        "en-US",
        options
      )} - ${end.getDate()}, ${end.toLocaleString("en-US", {
        month: "short",
        timeZone: APP_TIMEZONE,
      })} ${end.getFullYear()}`;
    }
    return `${start.toLocaleDateString(
      "en-US",
      options
    )} - ${end.toLocaleDateString("en-US", options)}, ${end.getFullYear()}`;
  }, [currentWeek]);

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

  return (
    <div>
      <div className="head_section">
        {/* Toolbar */}
        <div className="weekview-toolbar">
          <button onClick={handleToday} className="weekview-nav-btn">
            today
          </button>
          <h2 className="weekview-title">{formatWeekRange()}</h2>
          <span className="button-arrow">
            <button
              onClick={navigateToPreviousWeek}
              className="weekview-nav-btn"
            >
              <FontAwesomeIcon icon={faAngleLeft} />
            </button>
            <button onClick={navigateToNextWeek} className="weekview-nav-btn">
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
          </span>
        </div>
        {/* 12h/24h Toggle */}
        <div className="right-view">
          <div className="weekview-toggle-container">
            <button
              onClick={() => setTimeFormat("12h")}
              className={`weekview-toggle-btn weekview-toggle-btn-left ${
                timeFormat === "12h" ? "active" : "inactive"
              }`}
            >
              12h
            </button>
            <button
              onClick={() => setTimeFormat("24h")}
              className={`weekview-toggle-btn ${
                timeFormat === "24h" ? "active" : "inactive"
              }`}
            >
              24h
            </button>
          </div>
          {/* Switch buttons */}
          <div className="weekview-switch">
            <button
              className="weekview-switch-btn weekview-switch-week"
              disabled
            >
              week
            </button>
            <button
              className="weekview-switch-btn weekview-switch-month"
              onClick={() => onSwitchView("month")}
            >
              month
            </button>
          </div>
        </div>
      </div>
      {/* Week View Grid */}
      <div
        ref={gridContainerRef}
        className="weekview-grid"
        style={{
          gridTemplateRows: `60px 30px repeat(24, ${hourHeight}px)` /* Adjusted for empty row */,
          maxHeight: "calc(100vh - 200px)", // Make it scrollable
          overflowY: "auto",
        }}
      >
        {/* Current time indicator across the whole week */}
        {(() => {
          // Only show if today is in the current week
          const today = getCurrentDateInTimezone();
          const weekStart = currentWeek[0];
          const weekEnd = currentWeek[6];
          if (
            today >=
              new Date(
                weekStart.getFullYear(),
                weekStart.getMonth(),
                weekStart.getDate()
              ) &&
            today <=
              new Date(
                weekEnd.getFullYear(),
                weekEnd.getMonth(),
                weekEnd.getDate(),
                23,
                59,
                59
              )
          ) {
            // Get the current time in America/New_York timezone
            const currentTime = getCurrentDateInTimezone();
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            const totalMinutes = hours * 60 + minutes;

            // Position relative to the time grid content (after header and spacer)
            // Grid structure: 60px header + 30px spacer + (hour position * hourHeight)
            const top = 60 + 30 + (totalMinutes / 60) * hourHeight;

            return (
              <>
                <div
                  className="weekview-time-indicator"
                  style={{
                    position: "absolute",
                    top: top,
                    left: "60px", // Width of time column
                    right: "0",
                    height: "2px",
                    background: "#000", // Make it red so it's visible
                    zIndex: 20,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* Left vertical line */}
                  <div
                    className="weekview-time-indicator-line weekview-time-indicator-line-left"
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "-2px",
                      width: "1px",
                      height: "8px",
                      background: "#000",
                    }}
                  />
                  {/* Right vertical line */}
                  <div
                    className="weekview-time-indicator-line weekview-time-indicator-line-right"
                    style={{
                      position: "absolute",
                      right: "0",
                      top: "-2px",
                      width: "1px",
                      height: "8px",
                      background: "#000",
                    }}
                  />
                  {/* Time label (next to bar) */}
                  <span
                    className="weekview-time-indicator-label"
                    style={{
                      position: "absolute",
                      left: "-54px",
                      top: "-10px",
                      color: "#000",
                      fontWeight: "700",
                      fontSize: "13px",
                      background: "#fff",
                      padding: "0 4px",
                      borderRadius: "4px",
                      zIndex: 21,
                    }}
                  >
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: timeFormat === "12h",
                    })}
                  </span>
                </div>
              </>
            );
          }
          return null;
        })()}
        {/* Weekday header row */}
        <div className="weekview-header-empty" />
        {/* Empty row for spacing (newly added), now with white background */}
        <div
          className="weekview-empty-time-spacer"
          style={{ gridColumn: "1 / 2", gridRow: "2 / 3" }}
        />
        <div
          className="weekview-empty-day-spacer"
          style={{ gridColumn: "2 / span 7", gridRow: "2 / 3" }}
        />

        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => {
          const isToday =
            currentWeek[i] &&
            isSameDay(getCurrentDateInTimezone(), currentWeek[i]);
          return (
            <div
              key={d}
              className="weekview-header-cell"
              style={{
                gridColumn: `${i + 2} / ${i + 3}`,
                gridRow: "1 / 2",
              }}
            >
              <span className="weekview-header-cell-day-name">{d}</span>
              <span
                className="weekview-header-cell-date-number"
                style={{
                  color: isToday ? "#fff" : "#888",
                  background: isToday ? "#292929" : "transparent",
                  borderRadius: isToday ? "50%" : "none",
                }}
              >
                {currentWeek[i]?.getDate()}
              </span>
            </div>
          );
        })}
        {/* Time column (hours) */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="weekview-time-cell"
            style={{
              gridColumn: "1 / 2",
              gridRow: `${h + 3} / ${h + 4}` /* Adjusted for new empty row */,
              height: hourHeight,
            }}
          >
            <span className="weekview-time-cell-label">
              {getTimeLabel(h, timeFormat).toLowerCase()}
            </span>
          </div>
        ))}
        {/* Day columns (hour cells + events) */}
        {currentWeek.map((date, dayIdx) => {
          return (
            <div
              key={dayIdx}
              className={`weekview-day-col${
                dayIdx === 6 ? " weekview-day-col-last" : ""
              }`}
              style={{
                gridColumn: `${dayIdx + 2} / ${dayIdx + 3}`,
                gridRow: `3 / span 24`,
                minHeight: hourHeight * 24,
                position: "relative",
              }}
            >
              {/* Always render hour cell borders */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="weekview-hour-border"
                  style={{ top: h * hourHeight, height: hourHeight }}
                />
              ))}
              {/* Mobile: render a dot for each event in its time slot, each with its own popup */}
              {windowWidth < 640 && (
                <>
                  {/* Multi-day events as dots at the top */}
                  {events
                    .filter((event) => {
                      const start = getEventStart(event);
                      const end = getEventEnd(event);
                      if (!start || !end) return false;
                      return isMultiDay(event) && start <= date && date <= end;
                    })
                    .map((event, idx) => (
                      <div
                        key={event.id || idx}
                        className="event-dot"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopupEvent({ dayIdx, eventId: event.id || idx });
                        }}
                        style={{
                          cursor: "pointer",
                          display: "inline-block",
                          position: "absolute",
                          top: 2 + idx * 16, // stack dots for multi-day events
                          left: 2,
                          // Raise z-index when this dot's popup is active so the popup isn't hidden behind other elements
                          zIndex:
                            popupEvent &&
                            popupEvent.dayIdx === dayIdx &&
                            popupEvent.eventId === (event.id || idx)
                              ? 1001
                              : 2,
                        }}
                      >
                        ●{/* Popup for this event */}
                        {popupEvent &&
                          popupEvent.dayIdx === dayIdx &&
                          popupEvent.eventId === (event.id || idx) && (
                            <div
                              className="weekview-popup"
                              style={{
                                position: "absolute",
                                top: 18,
                                left: 18,
                                zIndex: 10,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="popup-close"
                                onClick={(e) => {
                                  e.stopPropagation(); // Stop event from bubbling up
                                  console.log("clicked");
                                  setPopupEvent(null);
                                }}
                                title="Close"
                              >
                                ×
                              </button>
                              <div className="popup-title">
                                {date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  timeZone: APP_TIMEZONE,
                                })}
                              </div>
                              <div className="popup-event">
                                {event.start.dateTime && (
                                  <span className="mr-1">
                                    {formatTime(
                                      event.start.dateTime,
                                      timeFormat
                                    )}
                                  </span>
                                )}
                                {event.summary || event.title}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  {/* Timed/single-day events as dots in their time slots */}
                  {(eventsByDay.get(dayIdx) || [])
                    .filter((event) => !isMultiDay(event))
                    .map((event, idx) => {
                      const start = event.convertedStart;
                      if (!start) return null;

                      const startHour =
                        start.getHours() + start.getMinutes() / 60;
                      const top = startHour * hourHeight;
                      return (
                        <div
                          key={event.id || idx}
                          className="event-dot"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopupEvent({ dayIdx, eventId: event.id || idx });
                          }}
                          style={{
                            cursor: "pointer",
                            display: "inline-block",
                            position: "absolute",
                            top: top + 2,
                            // left: 24,
                            // Raise z-index when this dot's popup is active so the popup isn't hidden behind other elements
                            zIndex:
                              popupEvent &&
                              popupEvent.dayIdx === dayIdx &&
                              popupEvent.eventId === (event.id || idx)
                                ? 1001
                                : 2,
                          }}
                        >
                          ●{/* Popup for this event */}
                          {popupEvent &&
                            popupEvent.dayIdx === dayIdx &&
                            popupEvent.eventId === (event.id || idx) && (
                              <div
                                className="weekview-popup"
                                style={{
                                  position: "absolute",
                                  top: 18,
                                  left: 18,
                                  zIndex: 1000,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="popup-close"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Stop event from bubbling up
                                    console.log("clicked");
                                    setPopupEvent(null);
                                  }}
                                  title="Close"
                                >
                                  ×
                                </button>
                                <div className="popup-title">
                                  {date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    timeZone: APP_TIMEZONE,
                                  })}
                                </div>
                                <div className="popup-event">
                                  {event.start.dateTime && (
                                    <span className="mr-1">
                                      {formatTime(
                                        event.start.dateTime,
                                        timeFormat
                                      )}
                                    </span>
                                  )}
                                  {event.summary || event.title}
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })}
                </>
              )}
              {/* Desktop: render events as before */}
              {windowWidth >= 640 && (
                <>
                  {/* Multi-day event bars stacked at the top below the date */}
                  <div className="weekview-multiday-event-container">
                    {(eventsByDay.get(dayIdx) || [])
                      .filter((event) => isMultiDay(event))
                      .map((event, idx) => {
                        const start = getEventStart(event)!;
                        const end = getEventEnd(event)!;
                        const weekStart = currentWeek[0];
                        const weekEnd = currentWeek[6];
                        const isFirstDay =
                          date.toDateString() ===
                          (start > weekStart
                            ? start
                            : weekStart
                          ).toDateString();
                        const isLastDay =
                          date.toDateString() ===
                          (end < weekEnd ? end : weekEnd).toDateString();
                        return (
                          <div
                            key={event.id}
                            className="weekview-event weekview-event-multiday"
                            style={{
                              top: idx * 26,
                              left: isFirstDay ? 2 : 0,
                              right: isLastDay ? 2 : 0,
                              borderTopLeftRadius: isFirstDay ? 2 : 0,
                              borderBottomLeftRadius: isFirstDay ? 2 : 0,
                              borderTopRightRadius: isLastDay ? 2 : 0,
                              borderBottomRightRadius: isLastDay ? 2 : 0,
                            }}
                            onMouseEnter={(e) => handleEventHover(event, e)}
                            onMouseLeave={handleEventLeave}
                          >
                            {event.summary}
                          </div>
                        );
                      })}
                  </div>
                  {/* Timed/single-day events */}
                  <div
                    className="weekview-timed-event-container"
                    style={{
                      marginTop: (() => {
                        // Count multi-day events for this day to offset single events
                        const multiDayCount = events.filter((event) => {
                          const start = getEventStart(event);
                          const end = getEventEnd(event);
                          if (!start || !end) return false;
                          return (
                            isMultiDay(event) && start <= date && date <= end
                          );
                        }).length;
                        return multiDayCount ? multiDayCount * 26 + 2 : 0;
                      })(),
                    }}
                  >
                    {(eventsByDay.get(dayIdx) || [])
                      .filter((event) => !isMultiDay(event))
                      .map((event, idx, arr) => {
                        const start = event.convertedStart;
                        const end = event.convertedEnd;
                        if (!start || !end) return null;

                        const startHour =
                          start.getHours() + start.getMinutes() / 60;
                        let endHour = end.getHours() + end.getMinutes() / 60;
                        // If event ends at 0:00 and is on the next day, treat as 24:00 for current day
                        if (
                          end.getHours() === 0 &&
                          end.getMinutes() === 0 &&
                          end > start &&
                          end.getDate() !== start.getDate()
                        ) {
                          endHour = 24;
                        }
                        const top = startHour * hourHeight;
                        const height = Math.max(
                          (endHour - startHour) * hourHeight,
                          28
                        );
                        // Find overlapping events for this day
                        const overlapping = arr.filter((e) => {
                          if (e === event) return false;
                          const s = e.convertedStart;
                          const en = e.convertedEnd;
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
                          (eventIdx === -1 ? 0 : eventIdx) *
                          (100 / overlapCount)
                        }%`;
                        return (
                          <div
                            key={event.id + idx}
                            className="weekview-event"
                            style={{
                              top,
                              left,
                              width,
                              height,
                            }}
                            onMouseEnter={(e) => handleEventHover(event, e)}
                            onMouseLeave={handleEventLeave}
                          >
                            {event.start.dateTime && (
                              <span className="mr-1">
                                {formatTime(event.start.dateTime, timeFormat)}
                              </span>
                            )}
                            {event.summary || event.title || `Event ${idx + 1}`}
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          );
        })}
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
              {formatTime(hoveredEvent.event.start.dateTime, timeFormat)}
              {hoveredEvent.event.end.dateTime &&
                ` - ${formatTime(hoveredEvent.event.end.dateTime, timeFormat)}`}
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

export default WeekView;
