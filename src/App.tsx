import React, { useState, useEffect } from "react";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import { fetchEvents } from "./services/googleCalendarApi";

import type { Event } from "./types";

const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    const loadEvents = async () => {
      const fetchedEvents = await fetchEvents();
      setEvents(fetchedEvents);
    };
    loadEvents();
  }, []);

  const handleSwitchView = (newView: "month" | "week") => {
    setView(newView);
  };

  return (
    <div className="calendar-container">
      {view === "week" ? (
        <WeekView events={events} onSwitchView={handleSwitchView} />
      ) : (
        <MonthView events={events} onSwitchView={handleSwitchView} />
      )}
    </div>
  );
};

export default App;
