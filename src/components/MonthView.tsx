import React, { useState } from "react";
import type { Event } from "../types";

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

const MonthView: React.FC<MonthViewProps> = ({ events, onSwitchView }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const weeks = getWeeksInMonth(year, month);

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div>
      <div className="monthview-toolbar">
        <button onClick={handlePreviousMonth} className="monthview-nav-btn">
          {"<"}
        </button>
        <button onClick={handleToday} className="monthview-nav-btn">
          today
        </button>
        <h2 className="monthview-title">
          {currentMonth.toLocaleString("default", { month: "long" })} {year}
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
      <table className="monthview-table">
        <thead>
          <tr>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <th key={i} className="monthview-th">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((date, di) => {
                const isCurrentMonth = date.getMonth() === month;
                const today = isToday(date);
                const dayEvents = isCurrentMonth
                  ? events.filter((event) => {
                      const eventDate = event.start.dateTime
                        ? new Date(event.start.dateTime)
                        : event.start.date
                        ? new Date(event.start.date)
                        : null;
                      return (
                        eventDate &&
                        eventDate.getFullYear() === year &&
                        eventDate.getMonth() === month &&
                        eventDate.getDate() === date.getDate()
                      );
                    })
                  : [];
                return (
                  <td
                    key={di}
                    className={
                      "monthview-td" +
                      (today
                        ? " monthview-today"
                        : isCurrentMonth
                        ? ""
                        : " monthview-other-month")
                    }
                  >
                    <div
                      className={
                        "monthview-date" +
                        (today ? " monthview-date-today" : "")
                      }
                    >
                      {date.getDate()}
                    </div>
                    <ul className="monthview-event-list">
                      {dayEvents.slice(0, 3).map((event) => (
                        <li
                          key={event.id}
                          className={
                            "monthview-event" +
                            (event.summary?.toLowerCase().includes("birthday")
                              ? " monthview-event-birthday"
                              : "")
                          }
                        >
                          {event.summary}
                          <div className="monthview-event-time">
                            {event.startTime
                              ? new Date(event.startTime).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}
                            {event.endTime
                              ? " - " +
                                new Date(event.endTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                        </li>
                      ))}
                      {dayEvents.length > 3 && (
                        <li className="monthview-event-more">
                          +{dayEvents.length - 3} more
                        </li>
                      )}
                    </ul>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthView;
