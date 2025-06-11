export const isSameDay = (
  date1: Date,
  date2: Date,
  timezone: string = "UTC"
) => {
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
    return false;
  }

  const d1 = new Date(date1.toLocaleString("en-US", { timeZone: timezone }));
  const d2 = new Date(date2.toLocaleString("en-US", { timeZone: timezone }));

  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const getWeekDays = (currentDate, selectedDate, breakRequest = null) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(startOfWeek.getDate() + index);
    const hasBreak = breakRequest && isSameDay(date, breakRequest.startDate);

    return {
      day: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
      date: date.getDate(),
      fullDate: date,
      isToday: isSameDay(date, new Date()),
      isActive: isSameDay(date, selectedDate),
      hasBreak: hasBreak,
    };
  });
};

export const getMonthDays = ({ currentDate, selectedDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startPadding = firstDayOfMonth.getDay();
  const totalDays = startPadding + lastDayOfMonth.getDate();
  const endPadding = 7 - (totalDays % 7);
  const allDays = [];
  const prevMonth = new Date(year, month, 0);
  const prevMonthLastDay = prevMonth.getDate();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(year, month - 1, prevMonthLastDay - i));
    allDays.push({
      day: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
      date: date.getDate(),
      fullDate: date,
      isToday: isSameDay(date, new Date()),
      isActive: isSameDay(date, selectedDate),
      isPadding: true,
    });
  }

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(Date.UTC(year, month, i));
    allDays.push({
      day: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
      date: i,
      fullDate: date,
      isToday: isSameDay(date, new Date()),
      isActive: isSameDay(date, selectedDate),
      isPadding: false,
    });
  }

  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(Date.UTC(year, month + 1, i));
    allDays.push({
      day: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
      date: i,
      fullDate: date,
      isToday: isSameDay(date, new Date()),
      isActive: isSameDay(date, selectedDate),
      isPadding: true,
    });
  }

  return allDays;
};
