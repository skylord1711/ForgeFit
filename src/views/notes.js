import { html, debounce } from '../utils/helpers.js';
import { getTodayKey, formatDateFull, formatDate } from '../utils/time.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import { generateId } from '../utils/helpers.js';
import db from '../db.js';
import { showModal, closeModal, renderModal } from '../components/modal.js';
import router from '../router.js';

export async function renderNotes() {
  const today = getTodayKey();
  let allNotes = await db.getAll('notes');
  allNotes.sort((a, b) => b.date.localeCompare(a.date));

  let currentNote = allNotes.find(n => n.date === today);
  if (!currentNote) {
    currentNote = { id: generateId(), date: today, text: '', createdAt: new Date().toISOString() };
    await db.put('notes', currentNote);
    allNotes.unshift(currentNote);
  }

  const render = () => {
    const container = document.getElementById('view-container');
    container.innerHTML = html`
      <div class="page">
        <div class="page-header">
          <div>
            <div class="page-title" style="font-size:24px;">Today's Notes</div>
            <div class="page-subtitle" style="margin-bottom:0;">${formatDateFull(today)}</div>
          </div>
        </div>

        <div class="glass-sm" style="padding:16px;margin-bottom:16px;">
          <textarea class="input" id="notes-main-input" placeholder="Write your thoughts, reminders, workout notes..." rows="8" style="resize:vertical;min-height:180px;font-size:15px;line-height:1.6;">${currentNote.text || ''}</textarea>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;text-align:right;" id="notes-save-status">Autosaved</div>
        </div>

        <div class="section-title" style="padding:0;margin-bottom:12px;">Previous Notes</div>
        <div class="exercise-list" id="notes-history-list">
          ${allNotes.filter(n => n.date !== today && n.text).map(n => html`
            <div class="glass-sm" style="padding:14px 16px;" data-note-date="${n.date}">
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div>
                  <div style="font-size:14px;font-weight:600;">${formatDate(n.date)}</div>
                  <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;line-height:1.4;white-space:pre-wrap;">${truncate(n.text, 120)}</div>
                </div>
                <button class="btn-icon" data-delete-note="${n.id}" style="width:28px;height:28px;flex-shrink:0;" title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
          ${allNotes.filter(n => n.date !== today && n.text).length === 0 ? html`
            <div style="font-size:14px;color:var(--text-tertiary);text-align:center;padding:20px;">
              No previous notes yet.
            </div>
          ` : ''}
        </div>
      </div>
    `;

    setupListeners(allNotes, today, render);
  };

  render();
}

function setupListeners(allNotes, today, render) {
  const container = document.getElementById('view-container');
  const mainInput = document.getElementById('notes-main-input');

  if (mainInput) {
    const autosave = debounce(async () => {
      const statusEl = document.getElementById('notes-save-status');
      if (statusEl) statusEl.textContent = 'Saving...';

      const currentNote = allNotes.find(n => n.date === today);
      if (currentNote) {
        currentNote.text = mainInput.value;
        currentNote.updatedAt = new Date().toISOString();
        await db.put('notes', currentNote);
      }

      if (statusEl) statusEl.textContent = 'Autosaved';
    }, 500);

    mainInput.addEventListener('input', autosave);
  }

  container.querySelectorAll('[data-delete-note]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      hapticLight();
      const id = el.dataset.deleteNote;
      showModal(renderModal(
        'Delete Note?',
        html`<p style="color:var(--text-secondary);text-align:center;">This will permanently delete this note.</p>`,
        html`
          <button class="btn btn-danger" id="confirm-delete-note">Delete</button>
          <button class="btn btn-ghost" data-close-modal>Cancel</button>
        `
      ));
      document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
      document.getElementById('confirm-delete-note')?.addEventListener('click', async () => {
        await db.remove('notes', id);
        hapticMedium();
        closeModal();
        renderNotes();
      });
    });
  });
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}
