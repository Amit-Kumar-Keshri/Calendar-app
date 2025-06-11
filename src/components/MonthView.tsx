import React, { use, useEffect, useState } from "react";
import type { Event } from "../types";
import { getMonthDays, getWeekDays } from "../utils/dateTime";
// import { calendar } from "googleapis/build/src/apis/calendar";

interface MonthViewProps {
  events: Event[];
  onSwitchView: (view: "month" | "week") => void;
}

const getWeeksInMonth = (year: number, month: number) => {
  const weeks: Date[][] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  let current = new Date(firstDayOfMonth);
  // Adjust to Monday (0=Sunday, 1=Monday)
  const dayOfWeek = current.getDay() === 0 ? 6 : current.getDay() - 1;
  current.setDate(current.getDate() - dayOfWeek);

  while (current <= lastDayOfMonth || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const isToday = (date: Date) => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

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

const formatTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [popupIdx, setPopupIdx] = useState<number | null>(null);

  const monthDays = getMonthDays({ currentDate, selectedDate });
  // console.log(monthDays);
  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
    setSelectedDate(prevMonth);
  };
  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
    setSelectedDate(nextMonth);
  };
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };
  
  
  
  const totalEventsinDay = (date: Date): Event[] => {
    return events.filter((event) => {
      const start = getEventStart(event);
      const end = getEventEnd(event);
      if (!start || !end) return false;
      return start <= date && date <= end;
    });
  };

  return (
    <div className="monthview-container">
      <div className="monthview-toolbar">
        <button onClick={handlePreviousMonth} className="monthview-nav-btn">
          {"<"}
        </button>
        <button onClick={handleToday} className="monthview-nav-btn">
          today
        </button>
        <h2 className="monthview-title">
          {getMonthName(currentDate)} {currentDate.getFullYear()}{" "}
        </h2>
        <button onClick={handleNextMonth} className="monthview-nav-btn">
          {">"}
        </button>
      </div>
      <div className="monthview-switch">
        <button className="monthview-switch-btn monthview-switch-month">
          month
        </button>
        <button
          className="monthview-switch-btn monthview-switch-week"
          onClick={() => onSwitchView("week")}
        >
          week
        </button>
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
              const timedEvents = events.filter((event) => {
                const start = event.start.dateTime
                  ? new Date(event.start.dateTime)
                  : null;
                if (!start) return false;
                return (
                  start.getFullYear() === day.fullDate.getFullYear() &&
                  start.getMonth() === day.fullDate.getMonth() &&
                  start.getDate() === day.fullDate.getDate()
                );
              });

              // All-day/multi-day events (those with start.date or multi-day)
              const allDayEvents = allEvents.filter(
                (event) => !event.start.dateTime || isMultiDay(event)
              );

              // Combine: show all-day/multi-day first, then timed events
              const dayEvents = [...allDayEvents, ...timedEvents];

              const showPopup = popupIdx === idx;
              return (
                <div className="monthview-td" key={idx}>
                  <div className="monthview-date">{day.date}</div>
                  {/* Show up to 3 events (all-day/multi-day first, then timed) */}
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div className="single-day-event" key={event.id || i}>
                      {/* Show time for timed events */}
                      {event.start.dateTime && (
                        <span
                          className="mr-1"
                          style={{
                            marginLeft: 0,
                            color: "#fff",
                            fontSize: "0.92em",
                          }}
                        >
                          {formatTime(event.start.dateTime)}
                        </span>
                      )}
                      {event.summary || event.title || `Event ${i + 1}`}
                    </div>
                  ))}
                  {/* Show "+N more" if more than 3 events */}
                  {dayEvents.length > 3 && (
                    <div
                      className="monthview-more-link"
                      onClick={() => setPopupIdx(idx)}
                    >
                      +{dayEvents.length - 3} more
                    </div>
                  )}
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
                        {day.fullDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      {dayEvents.map((event, i) => (
                        <div className="popup-event" key={event.id || i}>
                          {event.start.dateTime && (
                            <span
                              className="mr-1"
                              style={{
                                marginLeft: 4,
                                color: "#fff",
                                fontSize: "0.92em",
                              }}
                            >
                              {formatTime(event.start.dateTime)}
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
    </div>
  );
};
export default MonthView;