import { getElapsedSeconds, formatDuration } from '../utils/time.js';

let interval = null;
let callbacks = [];

export function startTimer(startTime, onTick) {
  stopTimer();
  if (onTick) callbacks.push(onTick);
  const tick = () => {
    const elapsed = getElapsedSeconds(startTime);
    callbacks.forEach(cb => cb(elapsed));
  };
  tick();
  interval = setInterval(tick, 1000);
  return () => stopTimer();
}

export function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  callbacks = [];
}

export function subscribeTimer(callback) {
  callbacks.push(callback);
  return () => {
    callbacks = callbacks.filter(cb => cb !== callback);
  };
}

export function renderTimerDisplay(elapsed) {
  return `<div class="timer-display">${formatDuration(elapsed)}</div>`;
}
