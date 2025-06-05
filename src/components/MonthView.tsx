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
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button onClick={handlePreviousMonth} style={{ marginRight: 8 }}>
          {"<"}
        </button>
        <button onClick={handleToday} style={{ marginRight: 8 }}>
          today
        </button>
        <h2
          style={{
            flex: 1,
            textAlign: "center",
            margin: 0,
          }}
        >
          {currentMonth.toLocaleString("default", { month: "long" })} {year}
        </h2>
        <button onClick={handleNextMonth} style={{ marginLeft: 8 }}>
          {">"}
        </button>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
        }}
      >
        <thead>
          <tr>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <th
                key={i}
                style={{
                  border: "1px solid #e0e0e0",
                  padding: "8px 0",
                  background: "#f7f7f7",
                  fontWeight: 500,
                }}
              >
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
                    style={{
                      border: "1px solid #e0e0e0",
                      verticalAlign: "top",
                      background: today
                        ? "#fffde7"
                        : isCurrentMonth
                        ? "#fafbfc"
                        : "#f0f0f0",
                      color: isCurrentMonth ? "#222" : "#bbb",
                      minWidth: 90,
                      height: 80,
                      padding: 4,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: today ? 700 : 400,
                        color: today ? "#1976d2" : undefined,
                        marginBottom: 2,
                      }}
                    >
                      {date.getDate()}
                    </div>
                    <ul className="event-list">
                      {dayEvents.slice(0, 3).map((event) => (
                        <li
                          key={event.id}
                          style={{
                            background: "#e3f2fd",
                            color: "#1976d2",
                            marginBottom: 2,
                            padding: "2px 4px",
                            borderRadius: 2,
                            fontSize: "0.95em",
                            fontWeight: event.summary
                              ?.toLowerCase()
                              .includes("birthday")
                              ? 700
                              : 400,
                          }}
                        >
                          {/* Event name */}
                          {event.summary}
                          {/* Start and end time below event name */}
                          <div style={{ fontSize: "0.9em", color: "#555" }}>
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
                        <li style={{ color: "#888", fontSize: "0.9em" }}>
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
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button style={{ background: "#1976d2", color: "#fff" }}>month</button>
        <button
          style={{ background: "#e0e0e0", color: "#222" }}
          onClick={() => onSwitchView("week")}
        >
          week
        </button>
      </div>
    </div>
  );
};

export default MonthView;
