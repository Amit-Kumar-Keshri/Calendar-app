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

const hourHeight = 56; // Increased from 40 to 56

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

  // Helper to format week range
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
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={navigateToPreviousWeek}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 16px",
            marginRight: 8,
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {"<"}
        </button>
        <button
          onClick={handleToday}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 16px",
            marginRight: 8,
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          today
        </button>
        <h2
          style={{
            flex: 1,
            textAlign: "center",
            margin: 0,
          }}
        >
          {formatWeekRange()}
        </h2>
        <button
          onClick={navigateToNextWeek}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 16px",
            marginLeft: 8,
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {">"}
        </button>
      </div>
      {/* Switch buttons */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          style={{
            background: "#e0e0e0",
            color: "#222",
            border: "none",
            borderRadius: 4,
            padding: "6px 16px",
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "pointer",
          }}
          onClick={() => onSwitchView("month")}
        >
          month
        </button>
        <button
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 16px",
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "default",
          }}
          disabled
        >
          week
        </button>
      </div>
      {/* Week View Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          gridTemplateRows: `32px repeat(24, ${hourHeight}px)`,
          marginTop: 24,
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
        }}
      >
        {/* Weekday header row */}
        <div
          style={{ gridColumn: "1 / 2", gridRow: "1 / 2", background: "#fff" }}
        />
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <div
            key={d}
            style={{
              gridColumn: `${i + 2} / ${i + 3}`,
              gridRow: "1 / 2",
              background: "#f7f7f7",
              borderLeft: "1px solid #e0e0e0",
              borderBottom: "1px solid #e0e0e0",
              textAlign: "center",
              fontWeight: 500,
              fontSize: 15,
              lineHeight: "32px",
            }}
          >
            {d}
          </div>
        ))}
        {/* Time column (hours) */}
        {HOURS.map((h, i) => (
          <div
            key={h}
            style={{
              gridColumn: "1 / 2",
              gridRow: `${i + 2} / ${i + 3}`,
              color: "#888",
              fontSize: 13,
              textAlign: "right",
              paddingRight: 8,
              borderBottom: "1px solid #e0e0e0",
              borderRight: "1px solid #e0e0e0",
              background: "#fafbfc",
              lineHeight: `${hourHeight}px`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              minHeight: hourHeight,
            }}
          >
            <span
              style={{ width: "100%", textAlign: "right", paddingRight: 8 }}
            >
              {getTimeLabel(h)}
            </span>
          </div>
        ))}
        {/* Day columns (hour cells + events) */}
        {currentWeek.map((date, dayIdx) =>
          // For each day column
          (
            <div
              key={dayIdx}
              style={{
                gridColumn: `${dayIdx + 2} / ${dayIdx + 3}`,
                gridRow: `2 / span 24`,
                position: "relative",
                background: "#fff",
                borderLeft: "1px solid #e0e0e0",
                borderRight: dayIdx === 6 ? "1px solid #e0e0e0" : undefined,
                borderBottom: "1px solid #e0e0e0",
                minHeight: hourHeight * 24,
                boxSizing: "border-box",
              }}
            >
              {/* Hour cell borders */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: h * hourHeight,
                    height: hourHeight,
                    borderBottom: "1px solid #e0e0e0",
                    pointerEvents: "none",
                  }}
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
                  const start = event.startTime ? new Date(event.startTime) : null;
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
                    // Overlap if time ranges intersect
                    return (
                      (startHour < enHour && endHour > sHour)
                    );
                  });
                  // Calculate width and left for overlapping events
                  const overlapCount = overlapping.length + 1;
                  const eventIdx = overlapping.findIndex((e) => e.id === event.id);
                  const width = `calc(${100 / overlapCount}% - 4px)`;
                  const left = `${(eventIdx === -1 ? 0 : eventIdx) * (100 / overlapCount)}%`;

                  return (
                    <div
                      key={event.id}
                      style={{
                        position: "absolute",
                        top,
                        left,
                        width,
                        height,
                        background: "#e3f2fd",
                        color: "#1976d2",
                        margin: "2px",
                        padding: "4px 6px",
                        borderRadius: 2,
                        fontSize: "0.95em",
                        boxSizing: "border-box",
                        zIndex: 2,
                        overflow: "hidden",
                        border: "1px solid #bbdefb",
                        boxShadow: "0 1px 4px #0001",
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{event.summary}</div>
                      <div style={{ fontSize: "0.9em", color: "#555" }}>
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
          )
        )}
      </div>
    </div>
  );
};

export default WeekView;
