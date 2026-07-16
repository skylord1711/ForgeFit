function nthWeekdayOfMonth(year, month, weekday, n) {
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  const offset = ((weekday - firstDay) + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, month, day);
}

function lastWeekdayOfMonth(year, month, weekday) {
  const last = new Date(year, month + 1, 0);
  const lastDay = last.getDay();
  const diff = (lastDay - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - diff);
}

function fmt(d) {
  return d.toISOString().split('T')[0];
}

export function getHolidaysForYear(year) {
  return [
    { date: fmt(new Date(year, 0, 1)), name: "New Year's Day", emoji: '🎆' },
    { date: fmt(nthWeekdayOfMonth(year, 0, 1, 3)), name: 'Martin Luther King Jr. Day', emoji: '✊' },
    { date: fmt(nthWeekdayOfMonth(year, 1, 1, 3)), name: "Presidents' Day", emoji: '🇺🇸' },
    { date: fmt(lastWeekdayOfMonth(year, 4, 1)), name: 'Memorial Day', emoji: '🎖️' },
    { date: fmt(new Date(year, 5, 19)), name: 'Juneteenth', emoji: '✊' },
    { date: fmt(new Date(year, 6, 4)), name: 'Independence Day', emoji: '🎆' },
    { date: fmt(nthWeekdayOfMonth(year, 8, 1, 1)), name: 'Labor Day', emoji: '⚒️' },
    { date: fmt(nthWeekdayOfMonth(year, 9, 1, 2)), name: 'Columbus Day', emoji: '🧭' },
    { date: fmt(new Date(year, 10, 11)), name: "Veterans Day", emoji: '🎖️' },
    { date: fmt(nthWeekdayOfMonth(year, 10, 4, 4)), name: 'Thanksgiving', emoji: '🦃' },
    { date: fmt(new Date(year, 11, 25)), name: 'Christmas Day', emoji: '🎄' }
  ];
}

export function getHolidaysForMonth(year, month) {
  return getHolidaysForYear(year).filter(h => {
    const d = new Date(h.date + 'T00:00:00');
    return d.getMonth() === month;
  });
}

export function getHolidayForDate(dateStr) {
  const year = parseInt(dateStr.split('-')[0], 10);
  return getHolidaysForYear(year).find(h => h.date === dateStr);
}
