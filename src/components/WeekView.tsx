import React, { useEffect, useState } from "react";
import type { Event } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";

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
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
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
  const [now, setNow] = useState(new Date());
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [popupIdx, setPopupIdx] = useState<number | null>(null);

  useEffect(() => {
    setCurrentWeek(generateWeekArray(currentMonday));
  }, [currentMonday]);

  // Add timer to update 'now' every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        className="weekview-grid"
        style={{
          gridTemplateRows: `60px 30px repeat(24, ${hourHeight}px)` /* Adjusted for empty row */,
        }}
      >
        {/* Current time indicator across the whole week */}
        {(() => {
          // Only show if today is in the current week
          const today = new Date();
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
            const minutes = now.getHours() * 60 + now.getMinutes();
            const top = 60 + 30 + (minutes / 60) * hourHeight; // Adjusted for header row and new empty row
            return (
              <>
                <div
                  className="weekview-time-indicator"
                  style={{
                    top: top,
                  }}
                >
                  {/* Left vertical line */}
                  <div className="weekview-time-indicator-line weekview-time-indicator-line-left" />
                  {/* Right vertical line */}
                  <div className="weekview-time-indicator-line weekview-time-indicator-line-right" />
                  {/* Time label (next to bar) */}
                  <span className="weekview-time-indicator-label">
                    {formatTime(now.toISOString(), timeFormat)}
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

        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
          const isToday =
            currentWeek[i] &&
            new Date().toDateString() === currentWeek[i].toDateString();
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
          // Gather all events for this day (timed and multi-day)
          const allEvents = events.filter((event) => {
            const start = getEventStart(event);
            const end = getEventEnd(event);
            if (!start || !end) return false;
            return start <= date && date <= end;
          });
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
              {/* Mobile: show one dot for any events, and popup on click */}
              {windowWidth < 640 && allEvents.length > 0 && (
                <div
                  className="event-dot"
                  onClick={() => setPopupIdx(dayIdx)}
                  style={{
                    cursor: "pointer",
                    display: "inline-block",
                    position: "absolute",
                    top: 2,
                    left: 2,
                    zIndex: 2,
                  }}
                >
                  ●
                </div>
              )}
              {/* Popup for all events on mobile */}
              {windowWidth < 640 && popupIdx === dayIdx && (
                <div
                  className="weekview-popup"
                  style={{ position: "absolute", top: 24, left: 2, zIndex: 10 }}
                >
                  <button
                    className="popup-close"
                    onClick={() => setPopupIdx(null)}
                    title="Close"
                  >
                    ×
                  </button>
                  <div className="popup-title">
                    {date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  {allEvents.map((event, i) => (
                    <div className="popup-event" key={event.id || i}>
                      {event.start.dateTime && (
                        <span className="mr-1">
                          {formatTime(event.start.dateTime, timeFormat)}
                        </span>
                      )}
                      {event.summary || event.title || `Event ${i + 1}`}
                    </div>
                  ))}
                </div>
              )}
              {/* Desktop: render events as before */}
              {windowWidth >= 640 && (
                <>
                  {/* Multi-day event bars stacked at the top below the date */}
                  <div className="weekview-multiday-event-container">
                    {events
                      .filter((event) => {
                        const start = getEventStart(event);
                        const end = getEventEnd(event);
                        if (!start || !end) return false;
                        return (
                          isMultiDay(event) && start <= date && date <= end
                        );
                      })
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
                        const end = event.endTime
                          ? new Date(event.endTime)
                          : null;
                        if (!start || !end) return null;
                        const startHour =
                          start.getHours() + start.getMinutes() / 60;
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
    </div>
  );
};

export default WeekView;
