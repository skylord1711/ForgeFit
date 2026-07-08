import { html } from '../utils/helpers.js';
import { formatDate, getTodayKey } from '../utils/time.js';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics.js';
import { generateId } from '../utils/helpers.js';
import db from '../db.js';
import { showModal, closeModal, renderModal, renderFormField } from '../components/modal.js';
import { showConfetti } from './workout.js';

let allPrs = [];
let filterExercise = '';

export async function renderPrs() {
  allPrs = await db.getAll('prs');
  allPrs.sort((a, b) => b.date?.localeCompare(a.date) || 0);
  filterExercise = '';
  render();
}

function render() {
  let filtered = allPrs;
  if (filterExercise) {
    filtered = allPrs.filter(p => p.exerciseName === filterExercise);
  }

  const exercises = [...new Set(allPrs.map(p => p.exerciseName))];

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title" style="font-size:24px;">Personal Records</div>
          <div class="page-subtitle">${allPrs.length} total PRs</div>
        </div>
        <button class="btn btn-primary" id="add-pr-btn" style="min-height:44px;padding:10px 16px;font-size:14px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add PR
        </button>
      </div>

      ${filterExercise ? html`
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <span class="chip chip-accent">${filterExercise}</span>
          <button class="btn btn-ghost" id="clear-filter" style="font-size:13px;">Clear filter</button>
        </div>
      ` : ''}

      ${exercises.length ? html`
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;-webkit-overflow-scrolling:touch;">
          ${exercises.map(ex => html`
            <button class="chip ${filterExercise === ex ? 'chip-purple' : ''}" data-filter-ex="${ex}" style="flex-shrink:0;cursor:pointer;">
              ${ex}
            </button>
          `)}
        </div>
      ` : ''}

      ${filtered.length ? html`
        <div class="exercise-list">
          ${filtered.map((pr, i) => html`
            <div class="pr-card glass list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}">
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div>
                  <div class="pr-card-title">${pr.exerciseName}</div>
                  <div style="font-size:13px;color:var(--text-tertiary);margin-bottom:4px;">${pr.prName}</div>
                </div>
                <button class="btn-icon" data-delete-pr="${pr.id}" style="width:32px;height:32px;flex-shrink:0;" title="Delete PR">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="pr-card-value">${pr.value}${pr.unit ? ' ' + pr.unit : ''}</div>
              <div class="pr-card-meta">${pr.date ? formatDate(pr.date) : ''}${pr.workoutName ? ' · ' + pr.workoutName : ''}</div>
              ${pr.notes ? html`<div style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">${pr.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : html`
        <div class="empty-state">
          <div class="empty-state-icon">🏆</div>
          <div class="empty-state-title">${allPrs.length ? 'No PRs for this exercise' : 'No Personal Records Yet'}</div>
          <div class="empty-state-text">${allPrs.length ? 'Select a different exercise above.' : 'Tap Add PR to create your first one.'}</div>
        </div>
      `}
    </div>
  `;

  setupListeners();
}

function setupListeners() {
  const container = document.getElementById('view-container');

  container.querySelectorAll('[data-filter-ex]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      filterExercise = el.dataset.filterEx;
      render();
    });
  });

  document.getElementById('clear-filter')?.addEventListener('click', () => {
    filterExercise = '';
    render();
  });

  container.querySelectorAll('[data-delete-pr]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      hapticLight();
      if (confirm('Delete this PR?')) {
        await db.remove('prs', el.dataset.deletePr);
        allPrs = allPrs.filter(p => p.id !== el.dataset.deletePr);
        render();
      }
    });
  });

  document.getElementById('add-pr-btn')?.addEventListener('click', () => {
    hapticLight();
    showAddPRModal();
  });
}

function showAddPRModal() {
  const body = html`
    ${renderFormField('Exercise Name', html`<input class="input" id="manual-pr-exercise" type="text" placeholder="e.g. Bench Press" autocomplete="off" />`)}
    ${renderFormField('PR Name', html`<select class="input" id="manual-pr-name">
      <option value="Highest Weight">Highest Weight</option>
      <option value="Best Set">Best Set</option>
      <option value="Best Set of 5">Best Set of 5</option>
      <option value="Best Set of 8">Best Set of 8</option>
      <option value="Best Set of 10">Best Set of 10</option>
      <option value="Estimated 1RM">Estimated 1RM</option>
      <option value="Custom">Custom</option>
    </select>`)}
    ${renderFormField('Value', html`<input class="input" id="manual-pr-value" type="text" placeholder="e.g. 225" autocomplete="off" />`)}
    ${renderFormField('Unit (optional)', html`<input class="input" id="manual-pr-unit" type="text" placeholder="lb, kg, reps, min:sec" autocomplete="off" />`)}
    ${renderFormField('Date', html`<input class="input" id="manual-pr-date" type="date" value="${getTodayKey()}" />`)}
    ${renderFormField('Workout (optional)', html`<input class="input" id="manual-pr-workout" type="text" placeholder="e.g. Push Day" autocomplete="off" />`)}
    ${renderFormField('Notes (optional)', html`<input class="input" id="manual-pr-notes" type="text" placeholder="How did this feel?" autocomplete="off" />`)}
  `;
  showModal(renderModal('New Personal Record', body, html`
    <button class="btn btn-primary" id="save-manual-pr-btn">Save PR</button>
    <button class="btn btn-ghost" data-close-modal>Cancel</button>
  `));

  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  document.getElementById('save-manual-pr-btn')?.addEventListener('click', async () => {
    const exerciseName = document.getElementById('manual-pr-exercise')?.value.trim();
    const prName = document.getElementById('manual-pr-name')?.value;
    const value = document.getElementById('manual-pr-value')?.value.trim();
    const unit = document.getElementById('manual-pr-unit')?.value.trim();
    const date = document.getElementById('manual-pr-date')?.value || getTodayKey();
    const workoutName = document.getElementById('manual-pr-workout')?.value.trim();
    const notes = document.getElementById('manual-pr-notes')?.value.trim();

    if (!exerciseName) { alert('Enter an exercise name.'); return; }
    if (!value) { alert('Enter a value.'); return; }

    const pr = {
      id: generateId(),
      exerciseName,
      prName,
      value,
      unit: unit || '',
      date,
      workoutName: workoutName || '',
      notes: notes || ''
    };
    await db.put('prs', pr);
    closeModal();
    hapticSuccess();
    showConfetti();
    allPrs.unshift(pr);
    render();
  });
}
