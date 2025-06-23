import React, { useState, useEffect, useCallback } from "react";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import { fetchEvents } from "./services/googleCalendarApi";
import { ERROR_MESSAGES, CALENDAR_VIEWS } from "./utils/constants";
import type { Event, CalendarView } from "./types";

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{error?.message || "An unexpected error occurred"}</p>
          <button onClick={() => setHasError(false)}>Try again</button>
        </div>
      )
    );
  }

  return <>{children}</>;
};

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading calendar events...</p>
  </div>
);

// Error display component
interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => (
  <div className="error-container">
    <h3>Failed to load events</h3>
    <p>{error}</p>
    <button onClick={onRetry} className="retry-button">
      Retry
    </button>
  </div>
);

const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<CalendarView>(CALENDAR_VIEWS.WEEK);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedEvents = await fetchEvents();
      setEvents(fetchedEvents);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : ERROR_MESSAGES.FAILED_TO_FETCH_EVENTS;

      setError(errorMessage);
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      // Limit retries to prevent infinite loops
      setRetryCount((prev) => prev + 1);
      loadEvents();
    }
  }, [loadEvents, retryCount]);

  const handleSwitchView = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto-retry with exponential backoff
  useEffect(() => {
    if (error && retryCount > 0 && retryCount < 3) {
      const timeout = setTimeout(() => {
        loadEvents();
      }, Math.pow(2, retryCount) * 1000); // 2s, 4s, 8s

      return () => clearTimeout(timeout);
    }
  }, [error, retryCount, loadEvents]);

  if (loading && events.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && events.length === 0) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  return (
    <ErrorBoundary>
      <div className="calendar-container">
        {error && events.length > 0 && (
          <div className="error-banner">
            <span>Failed to refresh events: {error}</span>
            <button onClick={handleRetry}>Retry</button>
          </div>
        )}

        {view === CALENDAR_VIEWS.WEEK ? (
          <WeekView events={events} onSwitchView={handleSwitchView} />
        ) : (
          <MonthView events={events} onSwitchView={handleSwitchView} />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
