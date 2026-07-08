const TIMEZONE = 'America/New_York';

export function getNow() {
  return new Date();
}

export function getTodayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(getNow());
}

export function getYesterdayKey() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(yesterday);
}

export function getCurrentTimeFormatted() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(getNow());
}

export function getCurrentDateFormatted() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(getNow());
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

export function formatTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d);
}

export function formatDateFull(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(d);
}

export function getElapsedSeconds(startTime) {
  if (!startTime) return 0;
  const start = new Date(startTime);
  const now = getNow();
  return Math.floor((now - start) / 1000);
}
