export interface Event {
    id: string;
    title?: string; // Optional for backward compatibility
    startTime?: string | null; // Optional for backward compatibility
    endTime?: string | null;
    startDate: string | null;
    endDate: string| null;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    location?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: string;
    }>;
}

export interface CalendarViewProps {
    events: Event[];
    onEventSelect: (event: Event) => void;
}

export interface WeekViewProps extends CalendarViewProps {
    currentWeek: Date;
    onWeekChange: (newWeek: Date) => void;
}

export interface MonthViewProps extends CalendarViewProps {
    currentMonth: Date;
    onMonthChange: (newMonth: Date) => void;
}