import { html } from '../utils/helpers.js';
import { hapticLight, hapticMedium } from '../utils/haptics.js';
import db from '../db.js';
import { showModal, closeModal, renderModal } from '../components/modal.js';

export async function renderSettings() {
  const units = await db.getSetting('units', 'lb');
  const theme = await db.getSetting('theme', 'dark');

  const container = document.getElementById('view-container');
  container.innerHTML = html`
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title" style="font-size:24px;">Settings</div>
        </div>
      </div>

      <div class="exercise-list">
        <div class="glass-sm" style="padding:16px;">
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;">Units</div>
          <div style="display:flex;gap:8px;">
            <button class="btn ${units === 'lb' ? 'btn-primary' : 'btn-secondary'}" data-set-unit="lb" style="flex:1;min-height:44px;font-size:14px;">Pounds (lb)</button>
            <button class="btn ${units === 'kg' ? 'btn-primary' : 'btn-secondary'}" data-set-unit="kg" style="flex:1;min-height:44px;font-size:14px;">Kilograms (kg)</button>
          </div>
        </div>

        <div class="glass-sm" style="padding:16px;margin-top:10px;">
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;">Theme</div>
          <div style="display:flex;gap:8px;">
            <button class="btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}" data-set-theme="dark" style="flex:1;min-height:44px;font-size:14px;">Dark</button>
            <button class="btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}" data-set-theme="system" style="flex:1;min-height:44px;font-size:14px;">System</button>
          </div>
        </div>

        <div class="divider"></div>

        <button class="btn btn-secondary w-full" data-action="export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Data
        </button>
        <button class="btn btn-secondary w-full mt-8" data-action="import">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Import Data
        </button>

        <div class="divider"></div>

        <button class="btn btn-danger w-full" data-action="delete-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          Delete All Data
        </button>
      </div>

      <div class="text-center mt-24" style="font-size:12px;color:var(--text-tertiary);">
        ForgeFit v1.0.0<br>
        Made with ❤️
      </div>
    </div>
  `;

  setupListeners(units);
}

function setupListeners(currentUnits) {
  const container = document.getElementById('view-container');

  container.querySelectorAll('[data-set-unit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      hapticLight();
      const unit = btn.dataset.setUnit;
      await db.setSetting('units', unit);
      renderSettings();
    });
  });

  container.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', async () => {
      hapticLight();
      const theme = btn.dataset.setTheme;
      await db.setSetting('theme', theme);
      renderSettings();
    });
  });

  container.querySelector('[data-action="export"]')?.addEventListener('click', async () => {
    hapticLight();
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workouts: await db.getAll('workouts'),
      templates: await db.getAll('templates'),
      prs: await db.getAll('prs'),
      settings: await db.getAll('settings')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forgefit-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  container.querySelector('[data-action="import"]')?.addEventListener('click', () => {
    hapticLight();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.workouts) for (const w of data.workouts) await db.put('workouts', w);
        if (data.templates) for (const t of data.templates) await db.put('templates', t);
        if (data.prs) for (const p of data.prs) await db.put('prs', p);
        hapticMedium();
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import data: ' + err.message);
      }
    };
    input.click();
  });

  container.querySelector('[data-action="delete-all"]')?.addEventListener('click', () => {
    hapticLight();
    showModal(renderModal(
      'Delete All Data?',
      html`<p style="color:var(--text-secondary);text-align:center;">This will permanently delete all workouts, templates, and personal records. This action cannot be undone.</p>`,
      html`
        <button class="btn btn-danger" id="confirm-delete-all">Delete Everything</button>
        <button class="btn btn-ghost" data-close-modal>Cancel</button>
      `
    ));
    document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    document.getElementById('confirm-delete-all')?.addEventListener('click', async () => {
      await db.clear('workouts');
      await db.clear('templates');
      await db.clear('prs');
      await db.clear('settings');
      closeModal();
      hapticMedium();
      renderSettings();
    });
  });
}
