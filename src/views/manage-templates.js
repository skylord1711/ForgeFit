import { html } from '../utils/helpers.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import { generateId } from '../utils/helpers.js';
import db from '../db.js';
import { showModal, closeModal, renderModal, renderFormField } from '../components/modal.js';

let templates = [];

export async function renderManageTemplates() {
  templates = await db.getAll('templates');
  render();
}

function render() {
  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <button class="btn btn-ghost" data-nav="choose-workout" style="padding-left:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <button class="btn btn-primary" data-action="create-template" style="min-height:40px;padding:8px 16px;font-size:14px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
      </div>
      <div class="page-title" style="font-size:24px;">Manage Workouts</div>
      <div class="page-subtitle">Edit, reorder, rename, or delete your workout templates</div>

      <div class="exercise-list">
        ${templates.length ? templates.map((t, i) => html`
          <div class="exercise-card list-item animate-fade-in-up stagger-${Math.min(i + 1, 8)}">
            <div class="exercise-card-header" style="cursor:default;">
              <span class="exercise-name">${t.name}</span>
              <span class="chip">${(t.exercises || []).length} ex</span>
            </div>
            <div style="padding:0 16px 4px;font-size:13px;color:var(--text-tertiary);">
              ${(t.exercises || []).map(e => e.name).join(' · ')}
            </div>
            <div style="padding:8px 16px 12px;display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-ghost" data-edit-template="${t.id}" style="font-size:13px;min-height:36px;padding:6px 12px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Exercises
              </button>
              <button class="btn btn-ghost" data-rename-template="${t.id}" style="font-size:13px;min-height:36px;padding:6px 12px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                Rename
              </button>
              <button class="btn btn-ghost" data-duplicate-template="${t.id}" style="font-size:13px;min-height:36px;padding:6px 12px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Duplicate
              </button>
              <button class="btn btn-ghost" data-delete-template="${t.id}" style="font-size:13px;min-height:36px;padding:6px 12px;color:var(--red);background:var(--red-dim);border-radius:var(--radius-md);border:1px solid rgba(255,71,87,0.2);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                Delete
              </button>
            </div>
          </div>
        `).join('') : html`
          <div class="empty-state">
            <div class="empty-state-title">No Workout Templates</div>
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

  container.querySelector('[data-action="create-template"]')?.addEventListener('click', () => {
    hapticLight();
    showCreateTemplateModal();
  });

  container.querySelectorAll('[data-edit-template]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      const tpl = templates.find(t => t.id === el.dataset.editTemplate);
      if (tpl) showEditExercisesModal(tpl);
    });
  });

  container.querySelectorAll('[data-rename-template]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      const tpl = templates.find(t => t.id === el.dataset.renameTemplate);
      if (tpl) showRenameModal(tpl);
    });
  });

  container.querySelectorAll('[data-duplicate-template]').forEach(el => {
    el.addEventListener('click', async () => {
      hapticLight();
      const tpl = templates.find(t => t.id === el.dataset.duplicateTemplate);
      if (tpl) {
        const dup = { ...tpl, id: generateId(), name: tpl.name + ' (Copy)' };
        await db.put('templates', dup);
        templates = await db.getAll('templates');
        render();
      }
    });
  });

  container.querySelectorAll('[data-delete-template]').forEach(el => {
    el.addEventListener('click', () => {
      hapticLight();
      const tpl = templates.find(t => t.id === el.dataset.deleteTemplate);
      if (tpl) {
        showModal(renderModal(
          `Delete "${tpl.name}"?`,
          html`<p style="color:var(--text-secondary);text-align:center;">This will permanently remove this workout template.</p>`,
          html`
            <button class="btn btn-danger" id="confirm-delete-tpl">Delete</button>
            <button class="btn btn-ghost" data-close-modal>Cancel</button>
          `
        ));
        document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
        document.getElementById('confirm-delete-tpl')?.addEventListener('click', async () => {
          await db.remove('templates', tpl.id);
          templates = templates.filter(t => t.id !== tpl.id);
          closeModal();
          render();
        });
      }
    });
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
    const exercises = exercisesText ? exercisesText.split('\n').map(s => s.trim()).filter(Boolean).map(n => ({ name: n })) : [];
    const tpl = { id: generateId(), name, exercises };
    await db.put('templates', tpl);
    templates.push(tpl);
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
        <button class="btn-icon" data-remove-exercise="${i}" style="width:28px;height:28px;color:var(--red);">
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

    document.querySelectorAll('[data-remove-exercise]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.removeExercise);
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
