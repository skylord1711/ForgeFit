import { html, debounce } from '../utils/helpers.js';
import { formatDate, formatTime, formatDuration } from '../utils/time.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import db from '../db.js';
import { showModal, closeModal, renderModal } from '../components/modal.js';

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let workouts = [];
let searchQuery = '';
let viewMode = 'list';

export async function renderHistory() {
  const all = await db.getAll('workouts');
  workouts = all.filter(w => w.completed).sort((a, b) => b.date.localeCompare(a.date));
  searchQuery = '';
  viewMode = 'list';
  render();
}

function render() {
  const filtered = searchQuery
    ? workouts.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.exercises || []).some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : workouts;

  let bodyHtml = '';

  if (filtered.length) {
    if (viewMode === 'day') {
      const grouped = {};
      for (const w of filtered) {
        if (!grouped[w.date]) grouped[w.date] = [];
        grouped[w.date].push(w);
      }
      const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      bodyHtml = sortedDates.map(date => html`
        <div class="mb-16">
          <div class="section-title" style="font-size:15px;color:var(--text-primary);text-transform:none;letter-spacing:0;font-weight:600;">${formatDate(date)}</div>
          ${grouped[date].map((w, i) => workoutListItem(w, i)).join('')}
        </div>
      `).join('');
    } else {
      bodyHtml = html`<div class="exercise-list">${filtered.map((w, i) => workoutListItem(w, i)).join('')}</div>`;
    }
  } else {
    bodyHtml = html`
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">${searchQuery ? 'No Results' : 'No Workouts Yet'}</div>
        <div class="empty-state-text">${searchQuery ? 'Try a different search term.' : 'Complete your first workout to see it here.'}</div>
      </div>
    `;
  }

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
        <input class="input" type="search" id="history-search" placeholder="Search workouts or exercises..." autocomplete="off" value="${escapeAttr(searchQuery)}" />
      </div>

      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button class="btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" data-view-mode="list" style="flex:1;min-height:40px;padding:10px;font-size:14px;">List</button>
        <button class="btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}" data-view-mode="day" style="flex:1;min-height:40px;padding:10px;font-size:14px;">By Day</button>
      </div>

      ${bodyHtml}
    </div>
  `;

  setupListeners();
}

function workoutListItem(w, i) {
  return html`
    <div class="exercise-card list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}" data-workout-id="${escapeAttr(w.id)}">
      <div class="exercise-card-header" data-view-id="${escapeAttr(w.id)}" style="cursor:pointer;">
        <div>
          <div class="exercise-name">${w.name}</div>
          <div style="font-size:13px;color:var(--text-tertiary);margin-top:2px;">
            ${w.startTime ? formatTime(w.startTime) : ''}
            ${w.duration ? ' · ' + formatDuration(w.duration) : ''}
          </div>
        </div>
        <div class="flex gap-8" style="align-items:center;">
          ${(w.exercises || []).filter(e => e.weight || e.reps).slice(0, 2).map(e => html`
            <span class="chip" style="font-size:11px;">${e.weight || '—'}×${e.reps || '—'}</span>
          `)}
          <button class="btn-icon" data-delete-workout="${escapeAttr(w.id)}" style="width:32px;height:32px;flex-shrink:0;" title="Delete workout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function setupListeners() {
  const container = document.getElementById('view-container');

  container.querySelectorAll('[data-view-id]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      showWorkoutDetail(el.dataset.viewId);
    });
  });

  container.querySelectorAll('[data-delete-workout]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      hapticLight();
      const id = el.dataset.deleteWorkout;
      showModal(renderModal(
        'Delete Workout?',
        html`<p style="color:var(--text-secondary);text-align:center;">This will permanently remove this workout from your history.</p>`,
        html`
          <button class="btn btn-danger" id="confirm-delete-workout">Delete</button>
          <button class="btn btn-ghost" data-close-modal>Cancel</button>
        `
      ));
      document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
      document.getElementById('confirm-delete-workout')?.addEventListener('click', async () => {
        try {
          await db.remove('workouts', id);
          workouts = workouts.filter(w => w.id !== id);
          closeModal();
          render();
        } catch (err) {
          console.error('Failed to delete workout:', err);
          closeModal();
        }
      });
    });
  });

  container.querySelectorAll('[data-view-mode]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      viewMode = el.dataset.viewMode;
      render();
    });
  });

  const searchInput = document.getElementById('history-search');
  if (searchInput) {
    const debouncedSearch = debounce((val) => {
      searchQuery = val;
      render();
    }, 200);
    searchInput.addEventListener('input', () => {
      debouncedSearch(searchInput.value);
    });
  }
}

async function showWorkoutDetail(workoutId) {
  const workout = workouts.find(w => w.id === workoutId);
  if (!workout) return;

  const renderDetail = () => {
    const container = document.getElementById('view-container');
    container.innerHTML = html`
      <div class="page">
        <div class="page-header">
          <button class="btn btn-ghost" data-back-history style="padding-left:0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <button class="btn btn-secondary" id="toggle-edit-btn" style="min-height:40px;padding:8px 16px;font-size:14px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
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

          <div class="section-title">Exercises</div>
          <div class="exercise-list" id="detail-exercise-list">
            ${(workout.exercises || []).map((e, i) => html`
              <div class="glass-sm list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}" style="padding:14px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                  <div style="font-weight:600;margin-bottom:8px;">${e.name}</div>
                </div>
                <div class="exercise-fields">
                  <div class="input-row">
                    <input class="input" type="number" inputmode="decimal" placeholder="Weight" data-edit-index="${i}" data-field="weight" value="${e.weight || ''}" ${workout._editing ? '' : 'disabled'} style="${workout._editing ? '' : 'opacity:0.6;'}"/>
                    <input class="input" type="number" inputmode="numeric" placeholder="Sets" data-edit-index="${i}" data-field="sets" value="${e.sets || ''}" ${workout._editing ? '' : 'disabled'} style="${workout._editing ? '' : 'opacity:0.6;'}"/>
                    <input class="input" type="number" inputmode="numeric" placeholder="Reps" data-edit-index="${i}" data-field="reps" value="${e.reps || ''}" ${workout._editing ? '' : 'disabled'} style="${workout._editing ? '' : 'opacity:0.6;'}"/>
                  </div>
                  <input class="input mt-8" type="text" placeholder="Notes" data-edit-index="${i}" data-field="notes" value="${e.notes || ''}" ${workout._editing ? '' : 'disabled'} style="${workout._editing ? '' : 'opacity:0.6;'}" />
                </div>
              </div>
            `).join('')}
          </div>

          <div class="mt-16">
            <label style="font-size:13px;color:var(--text-secondary);margin-bottom:6px;display:block;font-weight:500;">Workout Notes</label>
            <input class="input" type="text" id="detail-workout-notes" placeholder="Notes for this workout" value="${workout.notes || ''}" ${workout._editing ? '' : 'disabled'} style="${workout._editing ? '' : 'opacity:0.6;'}" />
          </div>

          ${workout._editing ? html`
            <div class="flex flex-col gap-8 mt-16">
              <button class="btn btn-primary" id="save-edit-btn">Save Changes</button>
              <button class="btn btn-ghost" id="cancel-edit-btn">Cancel</button>
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

    document.getElementById('toggle-edit-btn')?.addEventListener('click', () => {
      hapticLight();
      workout._editing = !workout._editing;
      renderDetail();
    });

    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
      workout._editing = false;
      renderDetail();
    });

    document.getElementById('save-edit-btn')?.addEventListener('click', async () => {
      hapticMedium();
      try {
        for (let i = 0; i < (workout.exercises || []).length; i++) {
          const ex = workout.exercises[i];
          const weightEl = container.querySelector(`[data-edit-index="${i}"][data-field="weight"]`);
          const setsEl = container.querySelector(`[data-edit-index="${i}"][data-field="sets"]`);
          const repsEl = container.querySelector(`[data-edit-index="${i}"][data-field="reps"]`);
          const notesEl = container.querySelector(`[data-edit-index="${i}"][data-field="notes"]`);
          if (weightEl) ex.weight = parseFloat(weightEl.value) || 0;
          if (setsEl) ex.sets = parseInt(setsEl.value, 10) || 0;
          if (repsEl) ex.reps = parseInt(repsEl.value, 10) || 0;
          if (notesEl) ex.notes = notesEl.value;
        }
        workout.notes = document.getElementById('detail-workout-notes')?.value || '';
        delete workout._editing;
        await db.put('workouts', workout);
        const idx = workouts.findIndex(w => w.id === workout.id);
        if (idx >= 0) workouts[idx] = workout;
        renderDetail();
      } catch (err) {
        console.error('Failed to save workout:', err);
        hapticMedium();
      }
    });
  };

  renderDetail();
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
