import { html } from '../utils/helpers.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import { generateId } from '../utils/helpers.js';
import { getTodayKey } from '../utils/time.js';
import db from '../db.js';
import { showModal, closeModal, renderModal, renderFormField } from '../components/modal.js';

let templates = [];
let selectedTemplate = null;

export async function renderChooseWorkout() {
  templates = await db.getAll('templates');
  if (!templates.length) {
    templates = getDefaultTemplates();
    for (const t of templates) {
      await db.put('templates', t);
    }
  }

  selectedTemplate = null;
  render();
}

function render() {
  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <div>
          <button class="btn btn-ghost" data-nav="home" style="padding-left:0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        </div>
      </div>
      <div class="page-title" style="font-size:24px;">Choose Today's Workout</div>
      <div class="page-subtitle">Select a workout template or mark as rest day</div>

      <div class="mt-8" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        <button class="btn btn-secondary" data-action="create" style="flex:1;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
        <button class="btn btn-secondary" data-action="rest-day" style="flex:1;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 10a1 1 0 012 0v4a1 1 0 01-2 0v-4z"/><path d="M15 10a1 1 0 012 0v4a1 1 0 01-2 0v-4z"/></svg>
          Rest Day
        </button>
      </div>

      <div class="exercise-list" id="template-list">
        ${templates.length ? templates.map((t, i) => html`
          <div class="exercise-card list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}" data-template-id="${t.id}">
            <div class="exercise-card-header" data-select="${t.id}" style="cursor:pointer;">
              <span class="exercise-name">${t.name}</span>
              <div class="flex gap-8" style="flex-shrink:0;">
                <span class="chip">${(t.exercises || []).length} exercises</span>
                <button class="btn-icon" data-template-options="${t.id}" style="width:32px;height:32px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>
              </div>
            </div>
            <div style="padding:0 16px 12px;font-size:13px;color:var(--text-tertiary);">
              ${(t.exercises || []).map(e => e.name).join(' · ')}
            </div>
          </div>
        `).join('') : html`
          <div class="empty-state">
            <div class="empty-state-title">No Templates</div>
            <div class="empty-state-text">Create your first workout template to get started.</div>
          </div>
        `}
      </div>
    </div>
  `;

  setupListeners();
}

function setupListeners() {
  const container = document.getElementById('view-container');

  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => window.location.hash = el.dataset.nav);
  });

  container.querySelectorAll('[data-select]').forEach(el => {
    el.addEventListener('click', () => {
      hapticMedium();
      const id = el.dataset.select;
      const template = templates.find(t => t.id === id);
      if (template) startWorkoutWithTemplate(template);
    });
  });

  container.querySelectorAll('[data-template-options]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      hapticLight();
      const id = el.dataset.templateOptions;
      const template = templates.find(t => t.id === id);
      if (template) showTemplateOptions(template);
    });
  });

  container.querySelector('[data-action="create"]')?.addEventListener('click', () => {
    hapticLight();
    showCreateTemplateModal();
  });

  container.querySelector('[data-action="rest-day"]')?.addEventListener('click', () => {
    hapticMedium();
    markRestDay();
  });
}

async function startWorkoutWithTemplate(template) {
  const today = getTodayKey();
  const existing = await db.getAll('workouts');
  const todayCompleted = existing.find(w => w.date === today && w.completed);
  if (todayCompleted) {
    showModal(renderModal(
      'Already Completed',
      html`<p style="color:var(--text-secondary);text-align:center;">You've already completed a workout today. Come back tomorrow!</p>`,
      html`<button class="btn btn-primary" data-close-modal>OK</button>`
    ));
    return;
  }

  const existingActive = existing.find(w => w.date === today && !w.completed);
  if (existingActive) {
    window.location.hash = 'workout';
    return;
  }

  const workout = {
    id: generateId(),
    name: template.name,
    date: today,
    startTime: new Date().toISOString(),
    finishTime: null,
    duration: null,
    exercises: (template.exercises || []).map(e => ({ name: e.name, weight: '', sets: '', reps: '', notes: '' })),
    notes: '',
    completed: false
  };
  await db.put('workouts', workout);
  window.location.hash = 'workout';
}

async function markRestDay() {
  const today = getTodayKey();
  const existing = await db.getAll('workouts');
  const todayCompleted = existing.find(w => w.date === today && w.completed);
  if (todayCompleted) {
    showModal(renderModal(
      'Already Completed',
      html`<p style="color:var(--text-secondary);text-align:center;">You already completed a workout today.</p>`,
      html`<button class="btn btn-primary" data-close-modal>OK</button>`
    ));
    return;
  }

  for (const w of existing) {
    if (w.date === today && !w.completed) {
      await db.remove('workouts', w.id);
    }
  }

  const prs = await db.getAll('prs');
  const recentPRs = prs.slice(-3).reverse().map(p => `${p.exerciseName}: ${p.value}${p.unit ? ' ' + p.unit : ''}`).join('\n');

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <button class="btn btn-ghost" data-nav="home" style="padding-left:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Home
        </button>
      </div>
      <div class="rest-day-content animate-scale-in">
        <div class="rest-day-icon">🛌</div>
        <div class="rest-day-title">Rest Day</div>
        <div class="rest-day-subtitle">Recovery is just as important as training.</div>
        <div class="rest-tips">
          <div class="rest-tip"><span class="rest-tip-icon">😴</span> Get 7-9 hours of quality sleep</div>
          <div class="rest-tip"><span class="rest-tip-icon">💪</span> Protein intake supports muscle recovery</div>
          <div class="rest-tip"><span class="rest-tip-icon">💧</span> Stay hydrated throughout the day</div>
          <div class="rest-tip"><span class="rest-tip-icon">📊</span> Review your progress and plan ahead</div>
        </div>
        ${recentPRs ? html`
          <div class="mt-24">
            <div class="section-title">Recent PRs</div>
            <div class="glass-sm" style="padding:16px;white-space:pre-line;font-size:14px;color:var(--text-secondary);">${recentPRs}</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  container.querySelector('[data-nav="home"]')?.addEventListener('click', () => window.location.hash = 'home');
}

function showTemplateOptions(template) {
  const body = html`
    <div class="flex flex-col gap-8">
      <button class="btn btn-secondary" data-tpl-rename="${template.id}">Rename</button>
      <button class="btn btn-secondary" data-tpl-duplicate="${template.id}">Duplicate</button>
      <button class="btn btn-secondary" data-tpl-edit="${template.id}">Edit Exercises</button>
      <button class="btn btn-danger" data-tpl-delete="${template.id}">Delete</button>
      <button class="btn btn-ghost" data-close-modal>Cancel</button>
    </div>
  `;
  showModal(renderModal(template.name, body));
  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  document.querySelector('[data-tpl-rename]')?.addEventListener('click', () => {
    closeModal();
    showRenameModal(template);
  });
  document.querySelector('[data-tpl-duplicate]')?.addEventListener('click', async () => {
    closeModal();
    const dup = { ...template, id: generateId(), name: template.name + ' (Copy)' };
    await db.put('templates', dup);
    render();
  });
  document.querySelector('[data-tpl-edit]')?.addEventListener('click', () => {
    closeModal();
    showEditExercisesModal(template);
  });
  document.querySelector('[data-tpl-delete]')?.addEventListener('click', async () => {
    if (confirm(`Delete "${template.name}"?`)) {
      await db.remove('templates', template.id);
      closeModal();
      render();
    }
  });
}

function showCreateTemplateModal() {
  let body = renderFormField('Workout Name', html`<input class="input" id="new-tpl-name" type="text" placeholder="e.g. Push, Pull, Legs" autocomplete="off" />`);
  body += renderFormField('Exercises (one per line)', html`<textarea class="input" id="new-tpl-exercises" rows="6" placeholder="Bench Press&#10;Overhead Press&#10;Lateral Raise&#10;Tricep Pushdown" style="resize:none;"></textarea>`);
  showModal(renderModal('New Workout', body, html`
    <button class="btn btn-primary" id="create-tpl-btn">Create Workout</button>
    <button class="btn btn-ghost" data-close-modal>Cancel</button>
  `));
  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  document.getElementById('create-tpl-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('new-tpl-name')?.value.trim();
    const exercisesText = document.getElementById('new-tpl-exercises')?.value.trim();
    if (!name) { alert('Please enter a workout name.'); return; }
    const exercises = exercisesText ? exercisesText.split('\n').map(s => s.trim()).filter(Boolean).map(name => ({ name })) : [];
    const tpl = { id: generateId(), name, exercises };
    await db.put('templates', tpl);
    closeModal();
    render();
  });
}

function showRenameModal(template) {
  const body = renderFormField('New Name', html`<input class="input" id="rename-input" type="text" value="${template.name}" autocomplete="off" />`);
  showModal(renderModal('Rename Workout', body, html`
    <button class="btn btn-primary" id="rename-btn">Save</button>
    <button class="btn btn-ghost" data-close-modal>Cancel</button>
  `));
  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  document.getElementById('rename-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('rename-input')?.value.trim();
    if (!name) return;
    template.name = name;
    await db.put('templates', template);
    closeModal();
    render();
  });
}

function showEditExercisesModal(template) {
  const exercises = template.exercises || [];

  const renderEditor = () => {
    const listHtml = exercises.map((ex, i) => html`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);">
        <span style="font-size:12px;color:var(--text-tertiary);min-width:20px;">${i + 1}.</span>
        <span style="flex:1;font-size:14px;">${ex.name}</span>
        <button class="btn-icon" data-reorder-up="${i}" style="width:28px;height:28px;${i === 0 ? 'opacity:0.3;pointer-events:none;' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button class="btn-icon" data-reorder-down="${i}" style="width:28px;height:28px;${i === exercises.length - 1 ? 'opacity:0.3;pointer-events:none;' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button class="btn-icon" data-remove-ex="${i}" style="width:28px;height:28px;color:var(--red);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');

    const body = html`
      ${listHtml}
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <input class="input" id="add-ex-name" type="text" placeholder="Add exercise..." style="flex:1;" />
        <button class="btn btn-secondary" id="add-ex-to-tpl" style="flex-shrink:0;">Add</button>
      </div>
    `;

    showModal(renderModal('Edit Exercises - ' + template.name, body, html`
      <button class="btn btn-primary" id="save-exercises-btn">Save Changes</button>
      <button class="btn btn-ghost" data-close-modal>Cancel</button>
    `));

    document.querySelectorAll('[data-reorder-up]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.reorderUp);
        if (idx > 0) {
          [exercises[idx - 1], exercises[idx]] = [exercises[idx], exercises[idx - 1]];
          closeModal();
          renderEditor();
        }
      });
    });

    document.querySelectorAll('[data-reorder-down]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.reorderDown);
        if (idx < exercises.length - 1) {
          [exercises[idx], exercises[idx + 1]] = [exercises[idx + 1], exercises[idx]];
          closeModal();
          renderEditor();
        }
      });
    });

    document.querySelectorAll('[data-remove-ex]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.removeEx);
        exercises.splice(idx, 1);
        closeModal();
        renderEditor();
      });
    });

    document.getElementById('add-ex-to-tpl')?.addEventListener('click', () => {
      const name = document.getElementById('add-ex-name')?.value.trim();
      if (name) {
        exercises.push({ name });
        document.getElementById('add-ex-name').value = '';
        closeModal();
        renderEditor();
      }
    });

    document.getElementById('add-ex-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const name = e.target.value.trim();
        if (name) {
          exercises.push({ name });
          e.target.value = '';
          closeModal();
          renderEditor();
        }
      }
    });

    document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    document.getElementById('save-exercises-btn')?.addEventListener('click', async () => {
      template.exercises = exercises;
      await db.put('templates', template);
      closeModal();
      render();
    });
  };

  renderEditor();
}

function getDefaultTemplates() {
  return [
    {
      id: generateId(),
      name: 'Push',
      exercises: [
        { name: 'Bench Press' }, { name: 'Overhead Press' },
        { name: 'Incline Dumbbell Press' }, { name: 'Lateral Raise' },
        { name: 'Tricep Pushdown' }, { name: 'Skull Crushers' }
      ]
    },
    {
      id: generateId(),
      name: 'Pull',
      exercises: [
        { name: 'Deadlift' }, { name: 'Pull Ups' },
        { name: 'Barbell Row' }, { name: 'Lat Pulldown' },
        { name: 'Face Pull' }, { name: 'Barbell Curl' }
      ]
    },
    {
      id: generateId(),
      name: 'Legs',
      exercises: [
        { name: 'Squat' }, { name: 'Romanian Deadlift' },
        { name: 'Leg Press' }, { name: 'Walking Lunges' },
        { name: 'Leg Curl' }, { name: 'Calf Raises' }
      ]
    },
    {
      id: generateId(),
      name: 'Upper',
      exercises: [
        { name: 'Bench Press' }, { name: 'Barbell Row' },
        { name: 'Overhead Press' }, { name: 'Pull Ups' },
        { name: 'Lateral Raise' }, { name: 'Barbell Curl' }, { name: 'Tricep Pushdown' }
      ]
    },
    {
      id: generateId(),
      name: 'Lower',
      exercises: [
        { name: 'Squat' }, { name: 'Romanian Deadlift' },
        { name: 'Leg Press' }, { name: 'Leg Curl' },
        { name: 'Calf Raises' }
      ]
    },
    {
      id: generateId(),
      name: 'Full Body',
      exercises: [
        { name: 'Squat' }, { name: 'Bench Press' },
        { name: 'Barbell Row' }, { name: 'Overhead Press' },
        { name: 'Deadlift' }
      ]
    }
  ];
}
