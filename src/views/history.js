import { html } from '../utils/helpers.js';
import { formatDate, formatTime, formatDuration, getTodayKey } from '../utils/time.js';
import { hapticLight } from '../utils/haptics.js';
import db from '../db.js';

let workouts = [];
let searchQuery = '';

export async function renderHistory() {
  const all = await db.getAll('workouts');
  workouts = all.filter(w => w.completed).sort((a, b) => b.date.localeCompare(a.date));
  searchQuery = '';
  render();
}

function render() {
  const filtered = searchQuery
    ? workouts.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.exercises || []).some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : workouts;

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title" style="font-size:24px;">History</div>
          <div class="page-subtitle">${workouts.length} total workouts</div>
        </div>
      </div>

      <div class="search-box">
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input class="input" type="search" id="history-search" placeholder="Search workouts or exercises..." autocomplete="off" />
      </div>

      ${filtered.length ? html`
        <div class="exercise-list">
          ${filtered.map((w, i) => html`
            <div class="exercise-card list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}" data-workout-id="${w.id}">
              <div class="exercise-card-header" data-view-id="${w.id}" style="cursor:pointer;">
                <div>
                  <div class="exercise-name">${w.name}</div>
                  <div style="font-size:13px;color:var(--text-tertiary);margin-top:2px;">
                    ${formatDate(w.date)} · ${w.startTime ? formatTime(w.startTime) : ''}
                    ${w.duration ? ' · ' + formatDuration(w.duration) : ''}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              <div style="padding:0 16px 12px;display:flex;flex-wrap:wrap;gap:4px;">
                ${(w.exercises || []).filter(e => e.weight || e.reps).slice(0, 5).map(e => html`
                  <span class="chip">${e.name}: ${e.weight || '—'}×${e.reps || '—'}</span>
                `)}
              </div>
            </div>
          `).join('')}
        </div>
      ` : html`
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">${searchQuery ? 'No Results' : 'No Workouts Yet'}</div>
          <div class="empty-state-text">${searchQuery ? 'Try a different search term.' : 'Complete your first workout to see it here.'}</div>
        </div>
      `}
    </div>
  `;

  setupListeners();
}

function setupListeners() {
  const container = document.getElementById('view-container');

  container.querySelectorAll('[data-view-id]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      const id = el.dataset.viewId;
      showWorkoutDetail(id);
    });
  });

  const searchInput = document.getElementById('history-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      render();
    });
  }
}

async function showWorkoutDetail(workoutId) {
  const workout = workouts.find(w => w.id === workoutId);
  if (!workout) return;

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <button class="btn btn-ghost" data-back-history style="padding-left:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
      </div>

      <div class="animate-fade-in-up">
        <div style="font-size:13px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Workout Summary</div>
        <div class="page-title" style="font-size:28px;">${workout.name}</div>
        <div style="font-size:15px;color:var(--text-secondary);margin-bottom:24px;">
          ${formatDate(workout.date)}<br>
          ${workout.startTime ? 'Started: ' + formatTime(workout.startTime) : ''}${workout.finishTime ? ' · Finished: ' + formatTime(workout.finishTime) : ''}<br>
          ${workout.duration ? 'Duration: ' + formatDuration(workout.duration) : ''}
        </div>

          ${(workout.exercises || []).filter(e => e.weight || e.reps).length ? html`
          <div class="section-title">Exercises</div>
          <div class="exercise-list">
            ${(workout.exercises || []).filter(e => e.weight || e.reps).map((e, i) => html`
              <div class="glass-sm list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" data-navigate-exercise="${e.name}">
                <div>
                  <div style="font-weight:600;">${e.name}</div>
                  ${e.notes ? html`<div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">${e.notes}</div>` : ''}
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:600;color:var(--accent);">${e.weight || '—'} × ${e.reps || '—'}</div>
                  ${e.sets ? html`<div style="font-size:12px;color:var(--text-tertiary);">${e.sets} sets</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : html`
          <div class="glass-sm" style="padding:24px;text-align:center;color:var(--text-tertiary);">
            No exercise data recorded for this workout.
          </div>
        `}

        ${workout.notes ? html`
          <div class="mt-16">
            <div class="section-title">Notes</div>
            <div class="glass-sm" style="padding:14px 16px;font-size:14px;color:var(--text-secondary);">${workout.notes}</div>
          </div>
        ` : ''}
      </div>

      <button class="btn btn-ghost mt-24" data-back-history>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to History
      </button>
    </div>
  `;

  container.querySelectorAll('[data-back-history]').forEach(el => {
    el.addEventListener('click', () => renderHistory());
  });

  container.querySelectorAll('[data-navigate-exercise]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = `exercise/${encodeURIComponent(el.dataset.navigateExercise)}`;
    });
  });
}

export async function renderWorkoutSummary(workoutId) {
  const all = await db.getAll('workouts');
  const workout = all.find(w => w.id === workoutId);
  if (workout) {
    workouts = all.filter(w => w.completed).sort((a, b) => b.date.localeCompare(a.date));
    showWorkoutDetail(workoutId);
  } else {
    renderHistory();
  }
}
