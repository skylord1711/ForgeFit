import { html } from '../utils/helpers.js';
import { getCurrentDateFormatted, getCurrentTimeFormatted, getTodayKey, getYesterdayKey, formatDateFull, formatTime, formatDuration, getElapsedSeconds } from '../utils/time.js';
import { hapticMedium, hapticLight } from '../utils/haptics.js';
import db from '../db.js';

export async function renderHome() {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  const allWorkouts = await db.getAll('workouts');
  const todayWorkout = allWorkouts.find(w => w.date === today && w.completed);
  const activeWorkout = allWorkouts.find(w => w.date === today && !w.completed && w.startTime);
  const yesterdayWorkout = allWorkouts.find(w => w.date === yesterday && w.completed);

  const hasMissed = !yesterdayWorkout && !todayWorkout;

  let dateTimeInterval;
  let timerInterval;

  const render = () => {
    const currentTime = getCurrentTimeFormatted();
    const currentDate = getCurrentDateFormatted();

    let mainContent = '';

    if (todayWorkout?.isRestDay) {
      mainContent = restDayCard(todayWorkout);
    } else if (todayWorkout) {
      mainContent = completedWorkoutCard(todayWorkout);
    } else if (activeWorkout) {
      const elapsed = getElapsedSeconds(activeWorkout.startTime);
      mainContent = activeWorkoutCard(activeWorkout, elapsed);
    } else {
      mainContent = startWorkoutButton();
    }

    const container = document.getElementById('view-container');
    container.innerHTML = html`
      <div class="page">
        <div class="page-header">
          <div>
            <div class="page-title" style="font-size:20px; margin-bottom:2px;">${currentDate}</div>
            <div class="page-subtitle" style="font-size:34px; font-weight:200; margin-bottom:0; letter-spacing:2px;" id="current-time">${currentTime}</div>
          </div>
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--purple));display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#000;flex-shrink:0;">
            F
          </div>
        </div>

        ${hasMissed && !todayWorkout ? html`
          <div class="missed-banner animate-fade-in-down">
            No workout was completed yesterday.
            <div class="flex gap-8 mt-8" style="justify-content:center;">
              <button class="btn btn-ghost" data-nav="choose-workout" style="font-size:13px;min-height:36px;padding:8px 16px;background:var(--surface);border-radius:var(--radius-md);">
                Continue Today
              </button>
              <button class="btn btn-ghost" data-nav="history" style="font-size:13px;min-height:36px;padding:8px 16px;background:var(--surface);border-radius:var(--radius-md);">
                View History
              </button>
            </div>
          </div>
        ` : ''}

        ${mainContent}
      </div>
    `;

    if (dateTimeInterval) clearInterval(dateTimeInterval);
    dateTimeInterval = setInterval(() => {
      const timeEl = document.getElementById('current-time');
      if (timeEl) timeEl.textContent = getCurrentTimeFormatted();
    }, 10000);

    if (timerInterval) clearInterval(timerInterval);
    if (activeWorkout && !todayWorkout) {
      timerInterval = setInterval(() => {
        const timerEl = document.getElementById('active-timer');
        if (timerEl) {
          timerEl.textContent = formatDuration(getElapsedSeconds(activeWorkout.startTime));
        }
      }, 1000);
    }

    setupHomeListeners(container);
  };

  render();

  return () => {
    if (dateTimeInterval) clearInterval(dateTimeInterval);
    if (timerInterval) clearInterval(timerInterval);
  };
}

function completedWorkoutCard(workout) {
  return html`
    <div class="glass complete-card animate-scale-in mt-8">
      <div class="complete-icon">✅</div>
      <div class="complete-title">Workout Completed</div>
      <div style="font-size:20px;font-weight:600;color:var(--accent);margin-bottom:8px;">${workout.name}</div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">
        ${formatDateFull(workout.date)}<br>
        ${workout.startTime ? `Started: ${formatTime(workout.startTime)}` : ''}${workout.finishTime ? ` · Finished: ${formatTime(workout.finishTime)}` : ''}<br>
        ${workout.duration ? `Duration: ${formatDuration(workout.duration)}` : ''}
      </div>
      <div class="complete-message" style="margin-bottom:20px;">
        You've completed today's workout. Great work! See you tomorrow.
      </div>
      <div class="flex flex-col gap-8">
        <button class="btn btn-secondary" data-view-summary="${workout.id}">View Workout Summary</button>
        <button class="btn btn-ghost" data-nav="history">History</button>
        <button class="btn btn-ghost" data-nav="prs">Personal Records</button>
        <button class="btn btn-ghost" data-restart-today style="color:var(--orange);">Restart Today</button>
      </div>
    </div>
  `;
}

function restDayCard(workout) {
  return html`
    <div class="glass complete-card animate-scale-in mt-8">
      <div style="font-size:48px;text-align:center;margin-bottom:12px;">🛌</div>
      <div class="complete-title" style="color:var(--purple);">Rest Day</div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;text-align:center;">
        ${formatDateFull(workout.date)}
      </div>
      <div class="complete-message" style="margin-bottom:20px;">
        Recovery is just as important as training.<br>
        Take the day off and come back stronger tomorrow.
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;">
        <span class="chip chip-purple">😴 Sleep</span>
        <span class="chip chip-purple">💪 Protein</span>
        <span class="chip chip-purple">💧 Hydrate</span>
        <span class="chip chip-purple">📊 Review</span>
      </div>
      <div class="flex flex-col gap-8">
        <button class="btn btn-primary" data-start-workout>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Workout
        </button>
        <button class="btn btn-ghost" data-nav="history">History</button>
        <button class="btn btn-ghost" data-nav="prs">Personal Records</button>
        <button class="btn btn-ghost" data-undo-rest-day style="color:var(--orange);">Undo Rest Day</button>
      </div>
    </div>
  `;
}

function activeWorkoutCard(workout, elapsed) {
  return html`
    <div class="glass animate-scale-in mt-8" style="padding:24px;">
      <div class="timer-label">Workout in Progress</div>
      <div class="timer-display" id="active-timer" style="font-size:36px;padding:12px 0;">${formatDuration(elapsed)}</div>
      <div style="font-size:18px;font-weight:600;color:var(--accent);margin-bottom:4px;">${workout.name}</div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;">
        Started: ${formatTime(workout.startTime)}
      </div>
      <button class="btn btn-primary w-full" data-nav="workout">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Resume Workout
      </button>
    </div>
  `;
}

function startWorkoutButton() {
  return html`
    <div class="mt-24 animate-fade-in-up">
      <button class="btn btn-primary btn-lg w-full animate-pulse-ring" data-nav="choose-workout" style="font-size:20px;font-weight:700;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start Workout
      </button>
      <div style="text-align:center;margin-top:12px;">
        <span class="chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Ready to train
        </span>
      </div>
    </div>
  `;
}

function setupHomeListeners(container) {
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = el.dataset.nav;
    });
  });

  container.querySelectorAll('[data-view-summary]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = `workout-summary/${el.dataset.viewSummary}`;
    });
  });

  container.querySelectorAll('[data-restart-today]').forEach(el => {
    el.addEventListener('click', async () => {
      hapticLight();
      const today = getTodayKey();
      const allWorkouts = await db.getAll('workouts');
      const todaysWorkouts = allWorkouts.filter(w => w.date === today);
      for (const w of todaysWorkouts) {
        await db.remove('workouts', w.id);
      }
      renderHome();
    });
  });

  container.querySelectorAll('[data-undo-rest-day]').forEach(el => {
    el.addEventListener('click', async () => {
      hapticLight();
      const today = getTodayKey();
      const allWorkouts = await db.getAll('workouts');
      const todaysRest = allWorkouts.filter(w => w.date === today && w.isRestDay);
      for (const w of todaysRest) {
        await db.remove('workouts', w.id);
      }
      renderHome();
    });
  });

  container.querySelectorAll('[data-start-workout]').forEach(el => {
    el.addEventListener('click', async () => {
      hapticLight();
      const today = getTodayKey();
      const allWorkouts = await db.getAll('workouts');
      const todaysRest = allWorkouts.filter(w => w.date === today && w.isRestDay);
      for (const w of todaysRest) {
        await db.remove('workouts', w.id);
      }
      window.location.hash = 'choose-workout';
    });
  });
}
