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
      // Fetch events for the current month by default
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const fetchedEvents = await fetchEvents(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
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
